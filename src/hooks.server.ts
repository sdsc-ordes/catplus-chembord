import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME } from '$env/static/private';
import type { Handle } from '@sveltejs/kit';
import archiver from 'archiver'; // Library for creating zip archives
import { PassThrough } from 'stream'; // Node.js stream utility

// --- S3 Configuration & Client Initialization ---

// Basic check for essential configuration
if (!AWS_REGION || !S3_BUCKET_NAME) {
	console.error('HOOKS: Missing required S3 configuration (AWS_REGION or S3_BUCKET_NAME)');
	throw new Error('Server configuration error: S3 settings missing.');
}

// Instantiate the S3 Client (runs once when the server module loads)
// Ensure credentials are secure (use IAM roles in production ideally)
const s3Client = new S3Client({
	region: AWS_REGION,
	// Avoid hardcoding credentials if possible. SDK will check env vars / IAM roles.
	// Only include credentials here if absolutely necessary and other methods aren't viable.
    credentials: { // Only needed if NOT using env vars or IAM roles
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    }
});

const BUCKET = S3_BUCKET_NAME;

// --- S3 Utility Functions (using the initialized client) ---

/** Get an object's content stream */
async function getObjectStream(key: string): Promise<NodeJS.ReadableStream | undefined> {
	const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
	try {
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

async function createZipStreamForPrefix(prefix: string): Promise<PassThrough> {
	// Ensure prefix ends with '/' for accurate relative path calculation and listing
	const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

	// Use the helper function to list all objects recursively under the prefix
	const objectsToZip = await listFilesInBucket(normalizedPrefix);

	if (objectsToZip.length === 0) {
		// Throw an error that the API route can catch and convert to a 404
		throw new Error(`No files found under prefix: ${normalizedPrefix}`);
	}
	console.log(`S3 Util (Zip Prefix): Found ${objectsToZip.length} objects to zip under ${normalizedPrefix}.`);


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
					console.log(`S3 Util (Zip Prefix): Appending ${relativePath} to archive...`);
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
	console.log(`S3 Util (Zip Prefix): Archive finalized for prefix ${normalizedPrefix}.`);

	// Return the stream that the archive is piping to
	return passThrough;
}


/** List object keys in a bucket/prefix */
async function listObjectsInBucket(prefix: string): Promise<string[]> {
	const command = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix });
	try {
		const response = await s3Client.send(command);
        //console.log("get list object in buckets");
		//console.log("response", response.Contents);
		return response.Contents?.map((item) => item.Key || '').filter(Boolean) as string[] || [];
	} catch (error: any) {
		console.error(`S3 Util: Error listing objects with prefix ${prefix}:`, error);
		throw error;
	}
}

// The FileInfo interface
interface FileInfo {
    Key: string; // The full S3 object key
    name: string; // The filename relative to its folder prefix
    Size?: number; // File size in bytes (optional)
    LastModified?: Date; // Last modified date (optional)
}

/** List common prefixes (folders) */
async function listFilesInBucket(prefix: string): Promise<FileInfo[]> {
    const command = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
    });
    try {
        const response = await s3Client.send(command);
        //console.log("get list files in buckets");
		const files = response.Contents?.map((item) => item.Key || '').filter(Boolean) as string[] || [];
		const fileInfoList: FileInfo[] = (response.Contents || [])
			.filter(s3Object => s3Object.Key)
			.map(s3Object => {
				// We know Key exists and is a string due to the filter above
				const fileKey = s3Object.Key!;
				// Find the last slash to determine the relative name
				const lastSlashIndex = fileKey.lastIndexOf('/');
				const relativeName = (lastSlashIndex === -1)
					? fileKey // If no slash, the name is the whole key (root file)
					: fileKey.substring(lastSlashIndex + 1); // Otherwise, get the part after the last slash
				// Create the FileInfo object
				return {
					Key: fileKey,
					name: relativeName,
					Size: s3Object.Size, // Directly map Size
					LastModified: s3Object.LastModified // Directly map LastModified (assuming it's already a Date object)
				};
			});
		//console.log("fileInfoList", fileInfoList);
		return fileInfoList;
    } catch (error: any) {
        console.error(`S3 Util: Error listing files with prefix ${prefix}:`, error);
        throw error;
    }
}

/** List common prefixes (folders) */
async function listFoldersInBucket(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        Delimiter: '/',
    });
    try {
        const response = await s3Client.send(command);
        //console.log("get list folders in buckets");
        // console.log("response", response);
		// console.log(Object.keys(response));
        return response.CommonPrefixes?.map(commonPrefix => commonPrefix.Prefix).filter(Boolean) as string[] || [];
    } catch (error: any) {
        console.error(`S3 Util: Error listing folders with prefix ${prefix}:`, error);
        throw error;
    }
}


/** Generate a pre-signed URL for client-side GET (download) */
async function getPresignedDownloadUrl(key: string, expiresInSeconds = 300): Promise<string> {
	const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
	try {
		console.log(key);
		const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
		console.log(url);
		return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
	} catch (error: any) {
		console.error(`S3 Util: Error generating presigned download URL for ${key}:`, error);
		if (error.name === 'NoSuchKey') throw new Error('File not found');
		throw error;
	}
}

// --- Handle Hook ---

export const handle: Handle = async ({ event, resolve }) => {
	// Add the S3 client and utility functions to event.locals
	// This makes them available in subsequent load functions and API routes
	event.locals.s3 = {
		client: s3Client, // The initialized client instance
		bucketName: BUCKET,
		getObjectStream: getObjectStream,
		listObjects: listObjectsInBucket,
        listFolders: listFoldersInBucket,
        listFiles: listFilesInBucket,
		getPresignedDownloadUrl: getPresignedDownloadUrl,
		createZipFile: createZipStreamForPrefix,
	};
	const response = await resolve(event);

	return response;
};
