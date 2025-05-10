interface Props {
    activefilesWithDownloadUrls: activefilesWithDownloadUrls,
    activeFolder: string,
    foldersWithFiles: foldersWithFiles,
    files: File,
    prefixQueried: string,
    bucket: string,
}

/**
 * Represents a file with its full S3 key, relative name, size, and last modified date.
 */
export interface FileInfo {
	Key: string; // The full S3 object key
	name: string; // The filename relative to its folder prefix
	Size?: number; // File size in bytes (optional)
	LastModified?: Date; // Last modified date (optional)
}

export const FileTableHeaders: String[] = ["File name", "Size", "Last modified", "Download"]

/**
 * Represents a folder prefix and the list of files directly under it.
 */
export interface FolderGroup {
	prefix: string; // The calculated folder prefix (e.g., 'batch/2024/05/16/24/') or '' for root
	files: FileInfo[]; // Array of files within this folder
}
