/**
 * Converts an S3-style prefix into a zip file name
 *
 * @param prefix - The s3 prefix of a folder (e.g., "batch/2024/05/16/24/").
 * @returns The zip file name as batch-2024-05-16-24.zip
 */
export function getZipFileName(prefix: String): string {
    const parts = prefix.split('/').filter(Boolean);
    const filename = `${parts.join("-")}.zip`;
    return filename;
}
