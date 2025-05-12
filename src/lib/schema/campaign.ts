/**
 * Interface for table columns of campaign file table
 */
export interface FileTableColumns {
	title: string; // Column title
	widthInPercent: number // Column width in percent
}

export const FileTableHeaders: FileTableColumns[] = [
    {title: "File name", widthInPercent: 45},
    {title: "Size", widthInPercent: 20},
    {title: "Last modified", widthInPercent: 25},
    {title: "Download", widthInPercent: 10},
]

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
