/**
 * Safely gets a value from a nested object using a dot-notation string path.
 * Example: getValueByPath(AppConfig, 'S3.AWS_REGION')
 * @param obj The object to query.
 * @param path The string path to the desired property.
 * @returns The value if found, otherwise undefined.
 */
export function getValueByPath(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}
