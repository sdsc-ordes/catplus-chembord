import { GetObjectCommand, ListObjectsV2Command, S3Client, paginateListObjectsV2 } from '@aws-sdk/client-s3';
import { AppServerConfig } from '$lib/server/environment';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import archiver from 'archiver'; // Library for creating zip archives
import { PassThrough } from 'stream'; // Node.js stream utility
import { logger } from '$lib/server/logger';

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

/**
 * Creates a zip stream from a specific list of S3 object keys.
 * @param s3ObjectKeys The array of S3 object keys (strings) to include in the zip.
 * @param basePrefix The S3 prefix to use for calculating relative paths inside the zip.
 * @returns A PassThrough stream of the generated zip archive.
 */
export async function createZipStreamFromKeys(s3ObjectKeys: string[], basePrefix: string): Promise<PassThrough> {
    if (s3ObjectKeys.length === 0) {
        throw new Error(`No file keys provided to create a zip stream.`);
    }

    // Ensure the base prefix ends with a slash for consistent relative path calculation
    const normalizedBasePrefix = basePrefix.endsWith('/') ? basePrefix : `${basePrefix}/`;

    const archive = archiver('zip', { zlib: { level: 9 } });
    const passThrough = new PassThrough();

    archive.pipe(passThrough);

    archive.on('warning', (err) => console.warn(`Archiver warning:`, err));
    archive.on('error', (err) => {
        console.error(`Archiver fatal error:`, err);
        passThrough.destroy(err);
    });

    const appendPromises = s3ObjectKeys.map(async (key) => {
        // The loop variable 'key' is now the S3 object key string
        if (!key) return;

        const objectStream = await getObjectStream(key);
        if (objectStream) {
            // Calculate the path inside the zip file
            const relativePath = key.substring(normalizedBasePrefix.length);
            if (relativePath) {
                archive.append(objectStream, { name: relativePath });
            }
        } else {
             console.warn(`Could not get stream for ${key}, skipping.`);
             archive.append(`Could not fetch ${key}`, { name: `${path.basename(key)}.error.txt` });
        }
    });

    await Promise.all(appendPromises);
    archive.finalize();
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

export interface DiscoveredPrefixes {
    prefixes: string[];
    count: number;
}

/**
 * Iteratively discovers all common prefixes down to a specific depth.
 * This is useful for finding all "leaf" folders in a nested structure.
 *
 * @param startPrefix The prefix to begin the search from (e.g., 'batch/').
 * @param targetDepth The number of slashes '/' in the final desired prefixes.
 * (e.g., 'batch/2024/05/16/22/' has a depth of 5).
 * @returns A promise that resolves to an object with the sorted list of prefixes and their count.
 */
export async function findLeafPrefixes(
    startPrefix: string,
    targetDepth: number
): Promise<DiscoveredPrefixes> {
    const s3Client = new S3Client({
        region: AppServerConfig.S3.AWS_REGION,
        endpoint: AppServerConfig.S3.AWS_S3_ENDPOINT,
        forcePathStyle: true,
        credentials: {
            accessKeyId: AppServerConfig.S3.AWS_ACCESS_KEY_ID,
            secretAccessKey: AppServerConfig.S3.AWS_SECRET_ACCESS_KEY,
        }
    });

    // Start with a list containing only the initial prefix
    let prefixesToExplore = [startPrefix];

    // Determine the current depth by counting slashes in the startPrefix
    const startDepth = (startPrefix.match(/\//g) || []).length;
    logger.debug({startPrefix, startDepth}, "prefix search")

    // Loop from the current depth until we reach the target depth
    for (let currentDepth = startDepth; currentDepth < targetDepth; currentDepth++) {
        logger.debug(`Discovering prefixes at depth ${currentDepth + 1}...`);

        // Fetch all sub-prefixes for the current level in parallel
        const promises = prefixesToExplore.map(prefix => {
            const command = new ListObjectsV2Command({
                Bucket: AppServerConfig.S3.S3_BUCKET_NAME,
                Prefix: prefix,
                Delimiter: '/',
            });
            return s3Client.send(command);
        });

        const responses = await Promise.all(promises);

        // Collect all the newly found "subfolders"
        const nextLevelPrefixes = responses.flatMap(
            response => response.CommonPrefixes?.map(p => p.Prefix!).filter(Boolean) || []
        );

        if (nextLevelPrefixes.length === 0) {
            logger.warn(`No further prefixes found at depth ${currentDepth + 1}. Stopping.`);
            prefixesToExplore = []; // Stop the loop
            break;
        }

        prefixesToExplore = nextLevelPrefixes;
        logger.debug({prefixesToExplore}, "prefixes in between");
    }

    // The loop is finished, prefixesToExplore now holds our campaign-level prefixes
    const finalPrefixes = prefixesToExplore.sort();

    return {
        prefixes: finalPrefixes,
        count: finalPrefixes.length,
    };
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
