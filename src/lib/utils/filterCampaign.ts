/**
 * Filters a list of files based on specific product and peak criteria.
 * @param {Array<{name: string}>} files - The array of file objects, each with a 'name' property.
 * @param {string | null} activeProduct - The product prefix for filtering 'Agilent' files.
 * @param {Array<string> | null} activePeaks - An array of peak prefixes for filtering 'IV' or 'MNR' files.
 * @returns {Array<{name: string}>} The new, filtered array of files.
 */
export function filterCampaignFiles(files: { name: string }[], activeProduct: string | null, activePeaks: string[] | null) {
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
