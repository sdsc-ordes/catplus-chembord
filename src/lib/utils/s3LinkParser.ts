/**
 * Converts an S3-style prefix with date components separated by slashes
 * into a URL-like path with date components separated by hyphens.
 * Assumes the last 4 segments are YYYY/MM/DD/HH.
 *
 * @param s3link - The output s3link (e.g., "batch/2024/05/16/24/").
 * @returns The transformed path string (e.g., "batch/2024-05-16-24")
 * or the original (trimmed) prefix if the format is unexpected.
 */
export function s3LinkToUrlPath(s3link: string): string {
    const path = s3link.replace("s3://", "");
    return path;
}
