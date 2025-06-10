import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { AppServerConfig } from '$lib/server/environment';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import archiver from 'archiver'; // Library for creating zip archives
import { PassThrough } from 'stream'; // Node.js stream utility

/**
 * S3 File Object Info
 */
export interface S3FileInfo {
	Key: string; // The full S3 object key
	name: string; // The filename relative to its folder prefix
	Size?: number; // File size in bytes (optional)
	LastModified?: Date; // Last modified date (optional)
}

/**
 * S3 File Info with a signed Url.
 */
interface S3FileInfoWithUrl extends S3FileInfo {
	presignedUrl?: string;
	presignedUrlError?: string;
}

/**
 * Get Object Stream from S3 for a key in the predefined S3 bucket
 * @param key - An S3 object key
 * @returns A Promise resolving to a new array of file objects.
 */
async function getObjectStream(key: string): Promise<NodeJS.ReadableStream | undefined> {
    const command = new GetObjectCommand({ Bucket: AppServerConfig.S3.S3_BUCKET_NAME, Key: key });
    try {
        const s3Client = new S3Client({
            region: AppServerConfig.S3.AWS_REGION,
            endpoint: AppServerConfig.S3.AWS_S3_ENDPOINT,
            forcePathStyle: true,
            credentials: {
                accessKeyId: AppServerConfig.S3.AWS_ACCESS_KEY_ID,
                secretAccessKey: AppServerConfig.S3.AWS_SECRET_ACCESS_KEY,
            }
        });
        const response = await s3Client.send(command);
        if (response.Body && typeof (response.Body as any).pipe === 'function') {
            return response.Body as NodeJS.ReadableStream;
        }
        console.warn(`S3 Util: Body for ${key} is not a Node.js ReadableStream.`);
        return undefined;
    } catch (error: any) {
        console.error(`S3 Util: Error getting object ${key}:`, error);
        if (error.name === 'NoSuchKey') return undefined;
        throw error;
    }
}

// create a Zip stream for a s3 prefix
export async function createZipStreamForPrefix(prefix: string): Promise<PassThrough> {
    // Ensure prefix ends with '/' for accurate relative path calculation and listing
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

    // Use the helper function to list all objects recursively under the prefix
    const objectsToZip = await listFilesInBucket(normalizedPrefix);

    if (objectsToZip.length === 0) {
        // Throw an error that the API route can catch and convert to a 404
        throw new Error(`No files found under prefix: ${normalizedPrefix}`);
    }

    const archive = archiver('zip', {
        zlib: { level: 9 }, // Set compression level
    });
    const passThrough = new PassThrough();

    // Pipe archive to passthrough FIRST, before adding files
    archive.pipe(passThrough);

    // Handle archive errors and propagate them to the passthrough stream
    archive.on('warning', (err) => {
        console.warn(`Archiver warning for prefix ${normalizedPrefix}:`, err);
    });
    archive.on('error', (err) => {
        console.error(`Archiver fatal error for prefix ${normalizedPrefix}:`, err);
        passThrough.destroy(err); // Destroy the output stream
    });

    // Asynchronously add files to the archive
    const appendPromises = objectsToZip.map(async (s3Object) => {
        if (!s3Object.Key) return; // Skip if key is somehow missing

        const objectStream = await getObjectStream(s3Object.Key); // Use the stream helper
        if (objectStream) {
            try {
                // Extract relative path for the zip entry
                const relativePath = s3Object.Key.substring(normalizedPrefix.length);
                // Only append if relativePath is not empty (don't add the folder itself)
                if (relativePath) {
                    archive.append(objectStream, { name: relativePath });
                }
            } catch (appendError) {
                console.error(`S3 Util (Zip Prefix): Error appending ${s3Object.Key} to archive:`, appendError);
                // Optionally add an error file to the zip
                archive.append(`Error processing ${s3Object.Key}`, { name: `${s3Object.Key}.error.txt` });
            }
        } else {
             console.warn(`S3 Util (Zip Prefix): Could not get stream for ${s3Object.Key}, skipping.`);
             // Optionally add an error file
             archive.append(`Could not fetch ${s3Object.Key}`, { name: `${path.basename(s3Object.Key)}.error.txt` });
        }
    });

    // Wait for all append operations to be *initiated*
    await Promise.all(appendPromises);

    // Finalize the archive *after* initiating all appends
    archive.finalize();

    // Return the stream that the archive is piping to
    return passThrough;
}

/**
 * Takes an prefix returns a list of objects for that prefix in a predefined S3 bucket
 *
 * @param prefix - An array of objects, each must have at least a 'Key' property.
 * @returns A Promise resolving to a new array of file objects.
 */
export async function listFilesInBucket(prefix: string): Promise<S3FileInfo[]> {
    const command = new ListObjectsV2Command({
        Bucket: AppServerConfig.S3.S3_BUCKET_NAME,
        Prefix: prefix,
    });
    try {
        const s3Client = new S3Client({
            region: AppServerConfig.S3.AWS_REGION,
            endpoint: AppServerConfig.S3.AWS_S3_ENDPOINT,
            forcePathStyle: true,
            credentials: {
                accessKeyId: AppServerConfig.S3.AWS_ACCESS_KEY_ID,
                secretAccessKey: AppServerConfig.S3.AWS_SECRET_ACCESS_KEY,
            }
        });
        const response = await s3Client.send(command);
        const files = response.Contents?.map((item) => item.Key || '').filter(Boolean) as string[] || [];
        const fileInfoList: S3FileInfo[] = (response.Contents || [])
            .filter(s3Object => s3Object.Key)
            .map(s3Object => {
                // We know Key exists and is a string due to the filter above
                const fileKey = s3Object.Key!;
                // Find the last slash to determine the relative name
                const lastSlashIndex = fileKey.lastIndexOf('/');
                const relativeName = (lastSlashIndex === -1)
                    ? fileKey // If no slash, the name is the whole key (root file)
                    : fileKey.substring(lastSlashIndex + 1); // Otherwise, get the part after the last slash
                // Create the S3FileInfo object
                return {
                    Key: fileKey,
                    name: relativeName,
                    Size: s3Object.Size, // Directly map Size
                    LastModified: s3Object.LastModified // Directly map LastModified (assuming it's already a Date object)
                };
            });
        return fileInfoList;
    } catch (error: any) {
        console.error(`S3 Util: Error listing files with prefix ${prefix}:`, error);
        throw error;
    }
}

/**
 * Takes an array of S3 file objects and adds a pre-signed GET URL to each.
 *
 * @param fileObjects - An array of objects, each must have at least a 'Key' property.
 * @param expiresInSeconds - Optional expiration time for the URLs in seconds (default: 300 = 5 minutes).
 * @returns A Promise resolving to a new array of file objects, each potentially augmented with a 'presignedUrl'.
 */
export async function addPresignedUrlsToFiles(
    fileObjects: S3FileInfo[],
    expiresInSeconds = 300
): Promise<S3FileInfoWithUrl[]> {
    // Return empty array if input is empty
    if (!fileObjects || fileObjects.length === 0) {
        return [];
    }

    // Use Promise.all to generate URLs concurrently for better performance
    const filesWithUrlsPromises = fileObjects.map(async (file): Promise<S3FileObjectWithUrl> => {
        if (!file.Key) {
            console.warn('Skipping file object without a Key:', file);
            return { ...file, presignedUrlError: 'Missing Key' };
        }

        const command = new GetObjectCommand({
            Bucket: AppServerConfig.S3.S3_BUCKET_NAME,
            Key: file.Key,
        });
        const s3Client = new S3Client({
            region: AppServerConfig.S3.AWS_REGION,
            endpoint: AppServerConfig.S3.AWS_S3_ENDPOINT,
            forcePathStyle: true,
            credentials: {
                accessKeyId: AppServerConfig.S3.AWS_ACCESS_KEY_ID,
                secretAccessKey: AppServerConfig.S3.AWS_SECRET_ACCESS_KEY,
            }
        });

        try {
            const url = await getSignedUrl(s3Client, command, {
                expiresIn: expiresInSeconds,
            });
            // Return a new object combining original properties and the URL
            return {
                ...file,
                presignedUrl: url,
            };
        } catch (error: any) {
            console.error(`Error generating pre-signed URL for key "${file.Key}":`, error);
            // Return the original object but add an error indicator
            return {
                ...file,
                presignedUrlError: error.message || 'Failed to generate URL',
            };
        }
    });

    // Wait for all promises to resolve
    const results = await Promise.all(filesWithUrlsPromises);
    return results;
}
