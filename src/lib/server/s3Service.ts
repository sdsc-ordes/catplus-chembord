// Example: src/lib/server/s3Service.ts OR directly in a +server.ts file

import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME } from "$env/static/private";

// Configure the S3 Client
// Credentials will be automatically sourced from environment variables
// (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN),
// shared credential file (~/.aws/credentials), or IAM role if running on AWS infrastructure.
// You can explicitly pass credentials if needed, but env vars/roles are more secure.
const s3Client = new S3Client({
    region: AWS_REGION,
      credentials: { // Only needed if NOT using env vars or IAM roles
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    }
});

const BUCKET = S3_BUCKET_NAME; // Your bucket name from env vars

// --- Example Functions ---

/** Get an object's content */
export async function getObjectFromS3(key: string): Promise<ReadableStream | undefined> {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });
    try {
        const response = await s3Client.send(command);
        // response.Body is a ReadableStream
        return response.Body as ReadableStream | undefined;
    } catch (error: any) {
        console.error(`Error getting object ${key} from S3:`, error);
        if (error.name === 'NoSuchKey') return undefined; // Handle file not found gracefully
        throw error; // Re-throw other errors
    }
}

/** List objects in a bucket */
export async function listObjectsInBucket(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
    });
    try {
        const response = await s3Client.send(command);
        if (response.Contents) {
            return response.Contents.map((item) => item.Key || "").filter(Boolean) as string[];
        }
        return [];
    } catch (error: any) {
        console.error(`Error listing objects in bucket ${BUCKET}:`, error);
        throw error; // Re-throw the error
    }
}


/** Generate a pre-signed URL for client-side GET (download) */
export async function getPresignedDownloadUrl(key: string, expiresInSeconds = 300): Promise<string> {
     const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });
    try {
        const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: expiresInSeconds,
        });
        return signedUrl;
    } catch (error: any) {
        console.error(`Error generating presigned download URL for ${key}:`, error);
         if (error.name === 'NoSuchKey') throw new Error('File not found'); // Handle specific errors
        throw error;
    }
}
