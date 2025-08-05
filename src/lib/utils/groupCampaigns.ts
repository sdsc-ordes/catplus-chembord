/**
 * An array of campaign prefixes and their derived data
 */
export interface CampaignResult {
	prefix: string,
	date: string,
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
