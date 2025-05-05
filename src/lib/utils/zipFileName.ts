export function getZipFileName(prefix: String): string {
    console.log("---prefix", prefix);
    const parts = prefix.split('/').filter(Boolean);
    const filename = `${parts.join("-")}.zip` || 'catplus-archive.zip';
    return filename;
}
