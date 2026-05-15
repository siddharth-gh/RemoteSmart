import fs from "fs/promises";
import path from "path";
import asyncHandler from "../utils/asyncHandler.js";
import {
    buildPublicUploadUrl,
    moveLocalUpload,
    optimizeVideoLocally,
    writeLocalUpload,
} from "../utils/localUpload.utils.js";
import {
    optimizeImageUpload,
    optimizePdfUpload,
} from "../utils/uploadOptimization.utils.js";
import {
    createVideoJob,
    getVideoJob,
    pruneExpiredVideoJobs,
    updateVideoJob,
} from "../utils/videoJobStore.js";
import { extractResourceText } from "../utils/resourceText.utils.js";
import {
    getMockTranscription,
    isTranscriptionConfigured,
    transcribeAudioFile,
} from "../services/transcription.service.js";
import { uploadFileToS3 } from "../utils/s3Upload.utils.js";
import Lecture from "../models/lecture.model.js";

const ensureFile = (file) => {
    if (!file) {
        const error = new Error("A file upload is required");
        error.statusCode = 400;
        throw error;
    }
};

const extensionFromName = (originalFilename, fallback) =>
    path.extname(originalFilename || "") || fallback;

export const uploadImage = asyncHandler(async (req, res) => {
    ensureFile(req.file);

    const optimized = await optimizeImageUpload({
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
    });

    const extension = extensionFromName(req.file.originalname, ".jpg");
    const saved = await writeLocalUpload({
        buffer: optimized.buffer,
        folderKey: "images",
        originalFilename: req.file.originalname,
        extension: extension,
    });

    const s3Url = await uploadFileToS3(saved.absolutePath, "images", req.file.mimetype, saved.filename);
    await fs.unlink(saved.absolutePath).catch(err => console.error("Failed to delete local image:", err));

    res.status(201).json({
        url: s3Url,
        bytes: optimized.optimizedBytes,
        originalBytes: optimized.originalBytes,
        optimizedBytes: optimized.optimizedBytes,
        isOptimized: optimized.optimized,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
    });
});

export const uploadResource = asyncHandler(async (req, res) => {
    ensureFile(req.file);

    const originalFilename = req.file.originalname;
    const mimeType = req.file.mimetype;
    const isPdf = mimeType === "application/pdf";
    const extension = extensionFromName(originalFilename, ".bin");

    // Step 1: Save to disk synchronously so we have a URL immediately
    let buffer = req.file.buffer;
    let optimized = { buffer, optimizedBytes: req.file.size, originalBytes: req.file.size, optimized: false };

    if (isPdf) {
        try {
            optimized = await optimizePdfUpload({
                buffer: req.file.buffer,
                mimeType: req.file.mimetype,
            });
        } catch (err) {
            console.error("PDF optimization failed, using original:", err.message);
        }
    }

    const saved = await writeLocalUpload({
        buffer: optimized.buffer,
        folderKey: "resources",
        originalFilename: originalFilename,
        extension: extension,
    });

    const s3Url = await uploadFileToS3(saved.absolutePath, "resources", mimeType, saved.filename);
    await fs.unlink(saved.absolutePath).catch(err => console.error("Failed to delete local resource:", err));

    // Create a job for tracking background extraction/AI
    const resourceType = isPdf
        ? "pdf"
        : (mimeType.includes("powerpoint") || 
           mimeType.includes("presentation") || 
           mimeType.includes("officedocument.presentationml"))
            ? (originalFilename.toLowerCase().endsWith('.pptx') ? "pptx" : "ppt")
            : (mimeType.includes("word") || 
               mimeType.includes("officedocument.wordprocessingml"))
                ? (originalFilename.toLowerCase().endsWith('.docx') ? "docx" : "doc")
                : mimeType === "text/plain"
                    ? "text"
                    : "file";

    const job = createVideoJob({
        status: "processing",
        progress: 50,
        message: "File saved. Extracting text...",
        stage: "transcription",
        originalFilename,
        mimeType,
        bytes: req.file.size,
        url: s3Url,
        type: resourceType,
    });

    // Start background processing (Extraction + AI)
    (async () => {
        console.log(`[Upload] Background processing started for jobId: ${job.jobId}`);
        try {
            // Step 3: Text Extraction (Transcript for PDF/PPTX)
            let extractedText = "";
            try {
                console.log(`[Upload] Starting extraction for ${originalFilename}...`);
                extractedText = await extractResourceText({
                    buffer: optimized.buffer,
                    mimeType: mimeType,
                });
            } catch (error) {
                console.error("Resource text extraction failed:", error.message);
            }

            // Step 4: Complete

            // Step 4: Complete
            const transcript = {
                status: "ready",
                text: extractedText,
                source: isPdf ? "pdf-parser" : "office-parser",
                error: ""
            };

            updateVideoJob(job.jobId, {
                status: "ready",
                progress: 100,
                message: "Resource processing complete.",
                stage: "complete",
                result: {
                    url: s3Url,
                    bytes: optimized.optimizedBytes,
                    originalBytes: optimized.originalBytes,
                    optimizedBytes: optimized.optimizedBytes,
                    isOptimized: optimized.optimized,
                    originalFilename: originalFilename,
                    mimeType: mimeType,
                    extractedText,
                    type: resourceType,
                    transcript
                },
            });

                console.log(`[Upload] Searching for lecture with jobId: ${job.jobId} to update transcript...`);
                Lecture.findOneAndUpdate(
                    { videoJobId: job.jobId },
                    { 
                        $set: { 
                            "transcript.status": "ready",
                            "transcript.text": extractedText,
                            "transcript.source": isPdf ? "pdf-parser" : "office-parser",
                            "transcript.error": "",
                            "resources.$[elem].extractedText": extractedText,
                            "resources.$[elem].isOptimized": optimized.optimized
                        } 
                    },
                    { 
                        arrayFilters: [{ "elem.originalFilename": originalFilename }],
                        returnDocument: "after"
                    }
                ).then(lecture => {
                    if (lecture) {
                        console.log(`[Upload] SUCCESS: Updated lecture ${lecture._id} (${lecture.title}) with transcript. Triggering AI...`);
                        import("../utils/lectureAiProcessor.js").then(({ queueLectureAiProcessing }) => {
                            queueLectureAiProcessing(lecture._id).catch(err => {
                                console.error("[Upload] AI Queueing failed for lecture:", lecture._id, err.message);
                            });
                        });
                    } else {
                        console.warn(`[Upload] WARNING: No lecture found with jobId ${job.jobId} yet. AI will trigger when teacher saves the lecture.`);
                    }
                }).catch(err => {
                    console.error("[Upload] ERROR: Background update failed:", err.message);
                });
        } catch (error) {
            console.error("Resource background processing failed:", error);
            updateVideoJob(job.jobId, {
                status: "failed",
                message: "Resource processing failed: " + error.message,
                stage: "failed",
            });
        }
    })();

    res.status(202).json({
        jobId: job.jobId,
        url: s3Url,
        originalFilename,
        mimeType,
        status: job.status,
        progress: job.progress,
        message: job.message
    });
});

export const uploadVideo = asyncHandler(async (req, res) => {
    ensureFile(req.file);

    const originalExtension = extensionFromName(req.file.originalname, ".mp4");
    const savedOriginal = req.file.path
        ? await moveLocalUpload({
              sourcePath: req.file.path,
              folderKey: "videosOriginal",
              originalFilename: req.file.originalname,
              extension: originalExtension,
          })
        : await writeLocalUpload({
              buffer: req.file.buffer,
              folderKey: "videosOriginal",
              originalFilename: req.file.originalname,
              extension: originalExtension,
          });

    pruneExpiredVideoJobs();

    const tempPendingUrl = "pending-s3-upload";

    const job = createVideoJob({
        status: "processing",
        progress: 38,
        message: "Upload complete. Preparing H.264 optimization...",
        stage: "queued",
        originalUrl: tempPendingUrl,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
        bytes: req.file.size,
        codec: "h264",
        duration: 0,
        isLowBandwidthOptimized: false,
    });

    optimizeVideoLocally({
        sourcePath: savedOriginal.absolutePath,
        originalFilename: req.file.originalname,
        onProgress: ({ progress, message, stage }) => {
            updateVideoJob(job.jobId, {
                status: "processing",
                progress,
                message,
                stage,
            });
        },
    })
        .then(async (optimizedVideo) => {
            const optimizedUrl = buildPublicUploadUrl(req, "videos/optimized", optimizedVideo.optimizedFilename);
            const audioUrl = buildPublicUploadUrl(req, "videos/audio", optimizedVideo.audioFilename);
            const thumbnailUrl = buildPublicUploadUrl(req, "thumbnails", optimizedVideo.thumbnailFilename);

            let transcript = {
                status: "idle",
                text: "",
                source: "",
                error: "",
            };

            if (!isTranscriptionConfigured()) {
                const mockTranscription = getMockTranscription();
                transcript = {
                    status: "ready",
                    text: mockTranscription.text,
                    source: mockTranscription.model,
                    error: "Whisper transcription is not available yet in testing mode.",
                };
            } else {
                updateVideoJob(job.jobId, {
                    status: "processing",
                    progress: 94,
                    message: "Transcribing audio with Whisper...",
                    stage: "transcription",
                });

                try {
                    const transcription = await transcribeAudioFile({
                        audioPath: optimizedVideo.audioPath,
                        audioBytes: optimizedVideo.audioBytes,
                        prompt: req.file.originalname,
                    });

                    transcript = {
                        status: "ready",
                        text: transcription.text,
                        source: transcription.model,
                        error: "",
                    };
                } catch (error) {
                    console.error("Video transcription failed, falling back to mock transcript:", error.message);
                    const mockTranscription = getMockTranscription();
                    transcript = {
                        status: "ready", // Still ready because we provide fallback text
                        text: mockTranscription.text,
                        source: "mock-fallback",
                        error: "Whisper failed: " + error.message,
                    };
                }
            }

            updateVideoJob(job.jobId, {
                status: "processing",
                progress: 98,
                message: "Uploading processed files to S3...",
                stage: "uploading",
            });

            let optimizedS3Url = "";
            let audioS3Url = "";
            let thumbnailS3Url = "";
            let originalS3Url = "";

            try {
                // Upload files to S3
                const originalFilenameInS3 = `original-${optimizedVideo.optimizedFilename}`;
                [optimizedS3Url, audioS3Url, thumbnailS3Url, originalS3Url] = await Promise.all([
                    uploadFileToS3(optimizedVideo.optimizedPath, "videos/optimized", "video/mp4", optimizedVideo.optimizedFilename),
                    uploadFileToS3(optimizedVideo.audioPath, "videos/audio", "audio/mp4", optimizedVideo.audioFilename),
                    uploadFileToS3(optimizedVideo.thumbnailPath, "videos/thumbnails", "image/jpeg", optimizedVideo.thumbnailFilename),
                    uploadFileToS3(savedOriginal.absolutePath, "videos/original", req.file.mimetype, originalFilenameInS3)
                ]);

                // Cleanup all local files after successful upload
                await Promise.all([
                    fs.unlink(savedOriginal.absolutePath).catch(() => {}),
                    fs.unlink(optimizedVideo.optimizedPath).catch(() => {}),
                    fs.unlink(optimizedVideo.audioPath).catch(() => {}),
                    fs.unlink(optimizedVideo.thumbnailPath).catch(() => {})
                ]);
            } catch (error) {
                console.error("Failed to upload videos to S3:", error);
                throw new Error("S3 Upload Failed: " + error.message);
            }

            updateVideoJob(job.jobId, {
                status: "ready",
                progress: 100,
                message: "Video processing finished. Ready to attach.",
                stage: "complete",
                result: {
                    url: originalS3Url, 
                    originalUrl: originalS3Url,
                    optimizedUrl: optimizedS3Url,
                    audioOnlyUrl: audioS3Url,
                    thumbnailUrl: thumbnailS3Url,
                    bytes: req.file.size,
                    originalSize: req.file.size,
                    optimizedSize: optimizedVideo.optimizedBytes,
                    audioOnlySize: optimizedVideo.audioBytes,
                    originalFilename: req.file.originalname,
                    mimeType: req.file.mimetype,
                    duration: 0,
                    codec: "h264",
                    isLowBandwidthOptimized: true,
                    transcript,
                },
            });

            // We KEEP local files in this mode because they ARE the storage
            // In S3 mode we would unlink them.
            
            // Background apply to Lecture if it exists
            import("../models/lecture.model.js").then(({ default: Lecture }) => {
                Lecture.findOne({ videoJobId: job.jobId }).then(lecture => {
                    if (lecture) {
                        const videoIndex = lecture.contents.findIndex(c => c.type === 'video');
                        if (videoIndex !== -1) {
                            lecture.contents[videoIndex].url = originalS3Url;
                            lecture.contents[videoIndex].originalUrl = originalS3Url;
                            lecture.contents[videoIndex].optimizedUrl = optimizedS3Url;
                            lecture.contents[videoIndex].audioOnlyUrl = audioS3Url;
                            lecture.contents[videoIndex].thumbnailUrl = thumbnailS3Url;
                            lecture.contents[videoIndex].originalSize = req.file.size;
                            lecture.contents[videoIndex].optimizedSize = optimizedVideo.optimizedBytes;
                            lecture.contents[videoIndex].audioOnlySize = optimizedVideo.audioBytes;
                            lecture.contents[videoIndex].duration = 0;
                            lecture.contents[videoIndex].isOptimized = true;
                        }
                        lecture.transcript = transcript;
                        lecture.save().then(() => {
                            import("../utils/lectureAiProcessor.js").then(({ queueLectureAiProcessing }) => {
                                queueLectureAiProcessing(lecture._id).catch(console.error);
                            });
                        }).catch(console.error);
                    }
                }).catch(console.error);
            });
        })
        .catch((error) => {
            updateVideoJob(job.jobId, {
                status: "failed",
                progress: 100,
                stage: "failed",
                message:
                    "Video processing or S3 upload failed. You can still save the lecture or retry later.",
                error: error.message,
                result: {
                    url: "",
                    bytes: req.file.size,
                    originalFilename: req.file.originalname,
                    mimeType: req.file.mimetype,
                    duration: 0,
                    codec: "",
                    isLowBandwidthOptimized: false,
                },
            });
        });

    res.status(202).json({
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        message: job.message,
        url: tempPendingUrl,
        bytes: req.file.size,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
    });
});

export const getUploadVideoStatus = asyncHandler(async (req, res) => {
    const job = getVideoJob(req.params.jobId);

    if (!job) {
        res.status(404);
        throw new Error("Video processing job not found");
    }

    res.json(job);
});
