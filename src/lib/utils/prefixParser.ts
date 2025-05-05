/**
 * Converts an S3-style prefix with date components separated by slashes
 * into a URL-like path with date components separated by hyphens.
 * Assumes the last 4 segments are YYYY/MM/DD/HH.
 *
 * @param prefix - The input prefix string (e.g., "batch/2024/05/16/24/").
 * @returns The transformed path string (e.g., "batch/2024-05-16-24")
 * or the original (trimmed) prefix if the format is unexpected.
 */
export function s3PrefixToUrlPath(prefix: string): string {
    const partsArray = prefix.split("/");
    partsArray.shift();
    partsArray.pop();
    const urlPath = `batch/${partsArray.join("-")}`
    return urlPath;
}