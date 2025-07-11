import type { S3FileInfo } from '$lib/server/s3';

/**
 * An array of campaign prefixes and their derived data
 */
export interface CampaignResult {
	prefix: string,
	date: string,
}

/**
 * Extracts unique directory prefixes from a list of S3 files.
 *
 * @param s3Files - An array of S3 objects
 * @returns A sorted array of unique campaign prefixes.
 */
export function groupFilesByCampaign(s3Files: S3FileInfo[] | undefined): CampaignResult[] {
    if (!s3Files) {
        return [];
    }
    let campaignPrefixes: string[] = s3Files
        .map(file => getS3FolderPrefix(file.Key))
        .filter((prefix): prefix is string => prefix !== null);
    const uniqueCampaignPrefixes = campaignPrefixes.filter((value, index, self) => self.indexOf(value) === index)
    const campaignResults = uniqueCampaignPrefixes.map(currentPrefix => {
        return {
          prefix: currentPrefix,
          date: extractDateFromPath(currentPrefix) ?? ''
        };
      });

    return campaignResults;
}

/**
 * Helper function: Extracts the folder path (prefix) from a full S3 key by removing the filename.
 * If the key represents a file at the root (no slashes), it returns an empty string,
 * representing the root "folder".
 * If the key already appears to be a folder path (ends with '/'), it returns it as is.
 *
 * @param s3Key The full S3 object key string, e.g., 'batch/2024/05/16/24/108-A1-Agilent-no-data.json'
 * @returns The folder path including the trailing slash (e.g., 'batch/2024/05/16/24/'),
 * an empty string ('') if the file is at the root, or null if the input is null/undefined.
 */
function getS3FolderPrefix(s3Key: string | null | undefined): string | null {
    if (s3Key === null || s3Key === undefined) {
        return null; // Handle null or undefined input gracefully
    }

    // Find the index of the last slash in the key
    const lastSlashIndex = s3Key.lastIndexOf('/');

    if (lastSlashIndex === -1) {
        // No slashes found, means the file is at the root level.
        // The "folder" or prefix for a root file is effectively the root itself.
        return ''; // Represent root prefix with an empty string
    } else {
        // Slash(es) found. The folder path is everything up to and including the last slash.
        return s3Key.substring(0, lastSlashIndex + 1);
    }
}

/**
 * Helper function: Extracts a date in YYYY/MM/DD format from a path string.
 * Expects a path like "batch/YYYY/MM/DD/..."
 *
 * @param pathString The input string, e.g., "batch/2024/05/16/24/"
 * @returns The extracted date string "YYYY/MM/DD", or null if the format is not matched or input is invalid.
 */
function extractDateFromPath(pathString: string | null | undefined): string | null {
    if (!pathString) {
        return null; // Handle null or undefined input
    }

    const match = pathString.match(/^batch\/(\d{4})\/(\d{2})\/(\d{2})\//i);

    if (match && match[1] && match[2] && match[3]) {
        const year = match[1];  // First captured group (YYYY)
        const month = match[2]; // Second captured group (MM)
        const day = match[3];   // Third captured group (DD)
        return `${year}/${month}/${day}`;
    } else {
        return null;
    }
}

// Define the structure of the output object for clarity
export interface CampaignResult {
    prefix: string;
    date: string;
}

/**
 * Transforms an array of S3 prefixes into an array of CampaignResult objects,
 * extracting the date from each prefix.
 *
 * @param prefixes An array of S3 prefix strings, e.g., "batch/YYYY/MM/DD/nr/".
 * @returns An array of CampaignResult objects.
 */
export function prefixesToCampaignResults(prefixes: string[]): CampaignResult[] {
    if (!Array.isArray(prefixes)) {
        return []; // Return an empty array if the input is not an array
    }

    return prefixes.map(prefix => {
        // Extract the date part: 'batch/YYYY/MM/DD/...' -> 'YYYY/MM/DD'
        // This takes a 10-character string starting at index 6.
        const date = prefix.substring(6, 16);

        // Return the new object in the desired format
        return {
            prefix: prefix,
            date: date
        };
    });
}
