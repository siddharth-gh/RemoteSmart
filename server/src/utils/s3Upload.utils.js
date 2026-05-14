import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

// Initialize the S3 client
// These variables must be provided in the .env file in production
const getS3Client = () => {
    const bucket = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME;
    if (!bucket || !process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error("Missing AWS S3 credentials in environment variables.");
    }
    
    return new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
};

/**
 * Uploads a local file to S3 and returns the public URL.
 * @param {string} localFilePath - The absolute path to the local file.
 * @param {string} folderKey - The folder prefix in S3 (e.g., 'images', 'videos/optimized').
 * @param {string} mimeType - The MIME type of the file.
 * @param {string} filename - The final filename to be stored in S3.
 * @returns {Promise<string>} The public S3 URL.
 */
export const uploadFileToS3 = async (localFilePath, folderKey, mimeType, filename) => {
    const s3 = getS3Client();
    const bucketName = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME;
    const s3Key = `${folderKey}/${filename}`;

    const fileStream = fs.createReadStream(localFilePath);

    const uploadParams = {
        Bucket: bucketName,
        Key: s3Key,
        Body: fileStream,
        ContentType: mimeType,
        // Depending on bucket settings, ACL might be rejected. If Bucket Owner Enforced is on,
        // the bucket itself must be configured for public access via Bucket Policy.
        // ACL: "public-read",
    };

    const command = new PutObjectCommand(uploadParams);
    
    try {
        await s3.send(command);
        // Return the public URL
        return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    } catch (error) {
        console.error("S3 Upload Error:", error);
        throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
};
