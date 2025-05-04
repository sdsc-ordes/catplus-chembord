import type { _Object } from '@aws-sdk/client-s3'; // Import the S3 Object type

/**
 * Represents a file with its full S3 key, relative name, size, and last modified date.
 */
interface FileInfo {
	Key: string; // The full S3 object key
	name: string; // The filename relative to its folder prefix
	Size?: number; // File size in bytes (optional)
	LastModified?: Date; // Last modified date (optional)
}

/**
 * Represents a folder prefix and the list of files directly under it.
 */
interface FolderGroup {
	prefix: string; // The calculated folder prefix (e.g., 'batch/2024/05/16/24/') or '' for root
	files: FileInfo[]; // Array of files within this folder
}


/**
 * Groups a flat list of S3 objects into folders based on their calculated directory prefix.
 *
 * @param allS3Objects - An array of S3 _Object items from ListObjectsV2Command response.Contents.
 * @returns An array of FolderGroup objects, sorted by prefix.
 */
export function groupFilesByCalculatedPrefix(allS3Objects: _Object[]): FolderGroup[] {
	// Use a Map to group files by their calculated prefix
	const filesByPrefixMap = new Map<string, FileInfo[]>();

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
	const result: FolderGroup[] = Array.from(filesByPrefixMap.entries()).map(([prefix, files]) => ({
		prefix: prefix,
		files: files,
	}));

	// Optional: Sort the result by prefix for consistent order
	result.sort((a, b) => a.prefix.localeCompare(b.prefix));

	return result;
}
