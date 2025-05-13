export function formatBytes(bytes: number | undefined | null, decimals = 2): string {
    if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
    const k = 1024; const dm = decimals < 0 ? 0 : decimals; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes <= 0) return '0 Bytes'; const i = Math.floor(Math.log(bytes) / Math.log(k));
    const sizeIndex = Math.min(i, sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(dm)) + ' ' + sizes[sizeIndex];
}

export function formatDate(date: Date | undefined | null): string {
    if (!date) return 'N/A'; if (date instanceof Date && !isNaN(date.getTime())) { return date.toLocaleString(); } return 'Invalid Date';
}

function formatToReadableCEST(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Europe/Paris',
        timeZoneName: 'short'
    };
    return date.toLocaleString('en-US', options);
}
