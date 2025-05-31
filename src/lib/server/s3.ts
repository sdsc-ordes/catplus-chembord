import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { S3_CLIENT, S3_BUCKET_NAME } from '$lib/server/environment';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import archiver from 'archiver'; // Library for creating zip archives
import { PassThrough } from 'stream'; // Node.js stream utility
import type { S3FileInfo } from '$lib/types/s3Search';

// --- S3 Utility Functions (using the initialized client) ---

/** Get an object's content stream */
async function getObjectStream(key: string): Promise<NodeJS.ReadableStream | undefined> {
    const command = new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key });
    try {
        const response = await S3_CLIENT.send(command);
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


/** List object keys in a bucket/prefix */
export async function listObjectsInBucket(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({ Bucket: S3_BUCKET_NAME, Prefix: prefix });
    try {
        const response = await S3_CLIENT.send(command);
        return response.Contents?.map((item) => item.Key || '').filter(Boolean) as string[] || [];
    } catch (error: any) {
        console.error(`S3 Util: Error listing objects with prefix ${prefix}:`, error);
        throw error;
    }
}

/** List common prefixes (folders) */
export async function listFilesInBucket(prefix: string): Promise<S3FileInfo[]> {
    const command = new ListObjectsV2Command({
        Bucket: S3_BUCKET_NAME,
        Prefix: prefix,
    });
    try {
        const response = await S3_CLIENT.send(command);
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

/** List common prefixes (folders) */
export async function listFoldersInBucket(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
        Bucket: S3_BUCKET_NAME,
        Prefix: prefix,
        Delimiter: '/',
    });
    try {
        const response = await S3_CLIENT.send(command);
        return response.CommonPrefixes?.map(commonPrefix => commonPrefix.Prefix).filter(Boolean) as string[] || [];
    } catch (error: any) {
        console.error(`S3 Util: Error listing folders with prefix ${prefix}:`, error);
        throw error;
    }
}


/** Generate a pre-signed URL for client-side GET (download) */
export async function getPresignedDownloadUrl(key: string, expiresInSeconds = 300): Promise<string> {
    const command = new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key });
    try {
        return await getSignedUrl(S3_CLIENT, command, { expiresIn: expiresInSeconds });
    } catch (error: any) {
        console.error(`S3 Util: Error generating presigned download URL for ${key}:`, error);
        if (error.name === 'NoSuchKey') throw new Error('File not found');
        throw error;
    }
}


// Define the input object structure
interface S3FileObjectInput {
	Key: string;
	Size?: number;
	LastModified?: Date;
	[key: string]: any;
}

// Define the output object structure, adding the presignedUrl
interface S3FileObjectWithUrl extends S3FileObjectInput {
	presignedUrl?: string; // The generated pre-signed URL (optional in case of error)
	presignedUrlError?: string; // Optional field to indicate if URL generation failed
}


/**
 * Takes an array of S3 file objects and adds a pre-signed GET URL to each.
 *
 * @param fileObjects - An array of objects, each must have at least a 'Key' property.
 * @param expiresInSeconds - Optional expiration time for the URLs in seconds (default: 300 = 5 minutes).
 * @returns A Promise resolving to a new array of file objects, each potentially augmented with a 'presignedUrl'.
 */
export async function addPresignedUrlsToFiles(
    fileObjects: S3FileObjectInput[],
    expiresInSeconds = 300
): Promise<S3FileObjectWithUrl[]> {
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
            Bucket: S3_BUCKET_NAME,
            Key: file.Key,
        });

        try {
            const url = await getSignedUrl(S3_CLIENT, command, {
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
