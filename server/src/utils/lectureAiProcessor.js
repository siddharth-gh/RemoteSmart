import Course from "../models/course.model.js";
import Lecture from "../models/lecture.model.js";
import Module from "../models/module.model.js";
import Quiz from "../models/quiz.model.js";
import {
    generateAdaptiveQuestionBank,
    generateLectureSummary,
    isAiConfigured,
} from "../services/ai.service.js";

const activeLectureJobs = new Set();

const buildLectureText = (lecture) => {
    const contentText =
        lecture.contents
            ?.filter((item) => item.type === "text" && item.data)
            .map((item) => item.data.trim())
            .filter(Boolean)
            .join("\n\n") || "";

    const resourceText =
        lecture.resources
            ?.map((resource) => resource?.extractedText || "")
            .map((value) => value.trim())
            .filter(Boolean)
            .join("\n\n") || "";

    return [contentText, resourceText].filter(Boolean).join("\n\n");
};

const markLectureFailed = async (lectureId, errorMessage) => {
    await Lecture.findByIdAndUpdate(lectureId, {
        $set: {
            "aiSummary.status": "failed",
            "aiSummary.error": errorMessage,
            "aiQuestionBank.status": "failed",
            "aiQuestionBank.error": errorMessage,
        },
    });
};

export const queueLectureAiProcessing = async (lectureId) => {
    console.log(`[AI Processor] Queuing lecture: ${lectureId}`);
    if (!isAiConfigured()) {
        console.warn(`[AI Processor] AI not configured. Skipping lecture: ${lectureId}`);
        return;
    }
    if (activeLectureJobs.has(String(lectureId))) {
        console.log(`[AI Processor] Lecture ${lectureId} is already being processed. Skipping duplicate job.`);
        return;
    }

    activeLectureJobs.add(String(lectureId));

    try {
        await Lecture.findByIdAndUpdate(lectureId, {
            $set: {
                "aiSummary.status": "processing",
                "aiSummary.error": "",
                "aiQuestionBank.status": "idle",
                "aiQuestionBank.error": "",
                "aiMcqs.status": "idle",
                "aiMcqs.questions": [],
                "aiMcqs.error": "",
            },
        });
        await Quiz.deleteMany({ sourceLectureId: lectureId, generatedBy: "ai" });

        const lecture = await Lecture.findById(lectureId).lean();

        if (!lecture) {
            return;
        }

        const [module, lectureCourseText] = await Promise.all([
            Module.findById(lecture.moduleId).lean(),
            Promise.resolve(buildLectureText(lecture)),
        ]);

        const course = module
            ? await Course.findById(module.courseId).lean()
            : null;

        const transcriptText = lecture.transcript?.text || "";

        if (!lectureCourseText && !transcriptText) {
            await Lecture.findByIdAndUpdate(lectureId, {
                $set: {
                    "aiSummary.status": "failed",
                    "aiSummary.error":
                        "Add lecture text first before generating the AI summary.",
                    "aiQuestionBank.status": "failed",
                    "aiQuestionBank.error":
                        "Add lecture text or a transcript first before generating adaptive practice.",
                },
            });
            return;
        }

        console.log(`[AI Processor] Starting summary generation for lecture: "${lecture.title}"`);
        const { summary, keyPoints } = await generateLectureSummary({
            courseTitle: course?.title || "Untitled course",
            moduleTitle: module?.title || "Untitled module",
            lectureTitle: lecture.title,
            lectureText: lectureCourseText,
            transcriptText,
        });

        console.log(`[AI Processor] Summary generated successfully for "${lecture.title}".`);
        console.log(`[AI Processor] Now starting adaptive quiz bank generation for "${lecture.title}"...`);

        await Lecture.findByIdAndUpdate(lectureId, {
            $set: {
                "aiSummary.status": "ready",
                "aiSummary.text": summary,
                "aiSummary.keyPoints": keyPoints,
                "aiSummary.generatedAt": new Date(),
                "aiSummary.error": "",
                "aiQuestionBank.status": "processing",
                "aiQuestionBank.error": "",
            },
        });

        console.log(`[AI Processor] Generating Easy questions...`);
        const easyQ = await generateAdaptiveQuestionBank({
            courseTitle: course?.title || "Untitled course",
            moduleTitle: module?.title || "Untitled module",
            lectureTitle: lecture.title,
            lectureText: lectureCourseText,
            transcriptText,
            difficulty: "easy",
            count: 5,
        });

        console.log(`[AI Processor] Generating Medium questions...`);
        const mediumQ = await generateAdaptiveQuestionBank({
            courseTitle: course?.title || "Untitled course",
            moduleTitle: module?.title || "Untitled module",
            lectureTitle: lecture.title,
            lectureText: lectureCourseText,
            transcriptText,
            difficulty: "medium",
            count: 5,
        });

        console.log(`[AI Processor] Generating Hard questions...`);
        const hardQ = await generateAdaptiveQuestionBank({
            courseTitle: course?.title || "Untitled course",
            moduleTitle: module?.title || "Untitled module",
            lectureTitle: lecture.title,
            lectureText: lectureCourseText,
            transcriptText,
            difficulty: "hard",
            count: 5,
        });

        const questionBank = [...easyQ, ...mediumQ, ...hardQ];

        await Lecture.findByIdAndUpdate(lectureId, {
            $set: {
                "aiQuestionBank.status": "ready",
                "aiQuestionBank.questions": questionBank,
                "aiQuestionBank.generatedAt": new Date(),
                "aiQuestionBank.error": "",
            },
        });

        // Create a formal Quiz document for the lecture
        if (questionBank.length > 0) {
            await Quiz.create({
                courseId: course._id,
                moduleId: module._id,
                sourceLectureId: lectureId,
                generatedBy: "ai",
                title: `${lecture.title} - AI Practice Quiz`,
                description: `Adaptive practice based on the lecture: ${lecture.title}`,
                questions: questionBank.map(q => ({
                    questionText: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation
                })),
                passingScore: 60,
                isPublished: true
            });
        }

        console.log(`[AI Processor] Done.`);
    } catch (error) {
        await markLectureFailed(
            lectureId,
            error.message || "AI lecture processing failed"
        );
    } finally {
        activeLectureJobs.delete(String(lectureId));
    }
};
