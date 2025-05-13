import type { _Object } from '@aws-sdk/client-s3';
import type { S3FileInfo, S3FolderGroup } from '$lib/schema/s3';

/**
 * Groups a flat list of S3 objects into folders based on their calculated directory prefix.
 *
 * @param allS3Objects - An array of S3 _Object items from ListObjectsV2Command response.Contents.
 * @returns An array of S3FolderGroup objects, sorted by prefix.
 */
export function groupFilesByCalculatedPrefix(allS3Objects: _Object[]): S3FolderGroup[] {
	// Use a Map to group files by their calculated prefix
	const filesByPrefixMap = new Map<string, S3FileInfo[]>();

	for (const s3Object of allS3Objects) {
		const fileKey = s3Object.Key; // Get the key from the object
		if (!fileKey) continue; // Skip if key is missing

		const lastSlashIndex = fileKey.lastIndexOf('/');
		let prefix: string;
		let relativeName: string;

		if (lastSlashIndex === -1) {
			// File is at the root level
			prefix = ''; // Use empty string to represent root
			relativeName = fileKey;
		} else {
			// File is in a "folder"
			prefix = fileKey.substring(0, lastSlashIndex + 1); // Include the trailing slash
			relativeName = fileKey.substring(lastSlashIndex + 1);
		}

		// Skip empty filenames (e.g., if key somehow ends with '/' or is a folder placeholder)
		if (!relativeName || s3Object.Size === 0) continue;

		// Get the existing list for this prefix or create a new one
		const fileList = filesByPrefixMap.get(prefix) || [];

		// Add the current file info, including Size and LastModified
		fileList.push({
			Key: fileKey,
			name: relativeName,
			Size: s3Object.Size, // Add Size
			LastModified: s3Object.LastModified, // Add LastModified
		});

		// Update the map
		filesByPrefixMap.set(prefix, fileList);
	}

	// Convert the map entries into the desired array structure
	const result: S3FolderGroup[] = Array.from(filesByPrefixMap.entries()).map(([prefix, files]) => ({
		prefix: prefix,
		files: files,
	}));

	// Optional: Sort the result by prefix for consistent order
	result.sort((a, b) => a.prefix.localeCompare(b.prefix));

	return result;
}
