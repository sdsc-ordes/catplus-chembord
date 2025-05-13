/**
 * Represents a file with its full S3 key, relative name, size, and last modified date.
 */
export interface S3FileInfo {
	Key: string; // The full S3 object key
	name: string; // The filename relative to its folder prefix
	Size?: number; // File size in bytes (optional)
	LastModified?: Date; // Last modified date (optional)
}
