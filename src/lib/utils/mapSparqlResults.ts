import type { SparqlBinding, FlatSparqlRow } from '$lib/schema/sparql'

/**
 * Transforms a single SparqlBinding object into a "flat" object
 * where keys are the variable names and values are their string values.
 * This version uses Object.entries, map, and Object.fromEntries for conciseness.
 *
 * @param binding The SparqlBinding object to transform.
 * @returns A flat object (e.g., { s3link: "value", campaignName: "value", ... }),
 * or null if the input binding is null, undefined, or empty.
 */
export function flattenSparqlBinding(
    binding: SparqlBinding | null | undefined
): FlatSparqlRow | null {
    // Guard clause for null, undefined, or empty input object
    if (!binding || Object.keys(binding).length === 0) {
        return null;
    }
    return Object.fromEntries(
        Object.entries(binding).map(([key, valueDetails]) => [key, valueDetails.value])
    ) as FlatSparqlRow;
}

export function s3LinkToPrefix(s3link: string): string {
    // Example: 's3://batch/2024/05/16/28/' -> 'batch/2024/05/16/28/'
    if (s3link && s3link.startsWith('s3://')) {
        return s3link.substring(5); // Removes 's3://'
    }
     // Return an empty string if the input is invalid
    return '';
}
