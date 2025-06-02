/**
 * Format File Size as human readable
 *
 * @param bytes: file size in bytes
 * @returns File size human readable
 */
export function formatBytes(bytes: number | undefined | null, decimals = 2): string {
    if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
    const k = 1024; const dm = decimals < 0 ? 0 : decimals; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes <= 0) return '0 Bytes'; const i = Math.floor(Math.log(bytes) / Math.log(k));
    const sizeIndex = Math.min(i, sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(dm)) + ' ' + sizes[sizeIndex];
}
