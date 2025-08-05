import type { S3FileInfo } from '$lib/server/s3';

/**
 * Filters a list of files based on specific product and peak criteria.
 * @param {Array<S3FileInfo>} files - The array of file objects.
 * @param {string | null} activeProduct - The product prefix for filtering 'Agilent' files.
 * @param {Array<string> | null} activePeaks - An array of peak prefixes for filtering 'IV' or 'MNR' files.
 * @returns {Array<S3FileInfo>} The new, filtered array of files.
 */
export function filterCampaignFiles(
    files: S3FileInfo[], activeProduct: string | null, activePeaks: string[] | null
): S3FileInfo[] {
    // If there are no files to filter, return an empty array.
    if (!files || files.length === 0) {
        return [];
    }

    return files.filter((file) => {
        const fileName = file.name;

        // Rule 1: Handle 'Agilent' files: keep only if the file name starts with the active product.
        if (fileName.includes('Agilent')) {
            if (activeProduct && fileName.startsWith(activeProduct)) {
                return true;
            } else {
                return false;
            }
        }

        // Rule 2: Handle 'IR' or 'MNR' files
        if (
            fileName.includes('IR') ||
            fileName.includes('NMR') ||
            fileName.includes('UV') ||
            fileName.includes('Bravo')
        ) {
            // Keep only if activePeaks exists and the file name starts with one of them.
            return (
                Array.isArray(activePeaks) &&
                activePeaks.length > 0 &&
                activePeaks.some((peak) => fileName.startsWith(peak))
            );
        }

        // Rule 3: If none of the above, keep all other files.
        return true;
    });
}
