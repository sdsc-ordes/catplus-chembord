import { S3Client, GetObjectCommand, type _Object } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
 * @param s3Client - The initialized S3Client instance.
 * @param bucketName - The name of the S3 bucket.
 * @param fileObjects - An array of objects, each must have at least a 'Key' property.
 * @param expiresInSeconds - Optional expiration time for the URLs in seconds (default: 300 = 5 minutes).
 * @returns A Promise resolving to a new array of file objects, each potentially augmented with a 'presignedUrl'.
 */
export async function addPresignedUrlsToFiles(
	s3Client: S3Client,
	bucketName: string,
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
			return { ...file, presignedUrlError: 'Missing Key' }; // Return original object with error flag
		}

		const command = new GetObjectCommand({
			Bucket: bucketName,
			Key: file.Key,
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
