/**
 * Interface for table columns of campaign file table
 */
export interface FileTableColumns {
	title: string; // Column title
	widthInPercent: number // Column width in percent
}

/**
 * Represents a file with its full S3 key, relative name, size, and last modified date.
 */
export interface CampaignFileAccess {
	Key: string; // The full S3 object key
	name: string; // The filename relative to its folder prefix
	Size: number; // File size in bytes (optional)
	LastModified: Date; // Last modified date (optional)
	presignedUrl: string;
}

/**
 * Campaign results from S3 filtering by prefix
 */
export interface CampaignResult {
	prefix: string;
	date: string;
}

export interface ResultItemBase {
	prefix: string;
}
