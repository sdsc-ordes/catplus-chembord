export interface SparqlSearchResult {
	prefix: string;
	campaignName: string;
	chemicalName: string;
	smiles: string;
	cas: string;
	reactionName: string;
	reactionType: string;
}

// Type for the flattened object
export type FlatSparqlRow = { [key: string]: string };

export interface SparqlBinding {
    [key: string]: { // This is the SPARQL variable name, e.g., "s", "p", "o"
        type: 'uri' | 'literal' | 'bnode';
        value: string; // This is the actual value we want to extract
        datatype?: string;
        'xml:lang'?: string;
    };
}

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

/**
 * Maps SPARQL JSON result bindings to a simple array of arrays for table display.
 * @param results - The array of binding objects from SPARQL JSON result.
 * @param keysInOrder - An array of strings representing the variable names in the desired column order.
 * @returns An array of arrays, where each inner array is a row of string values.
 */
export function mapSparqlResultsToTableBody(results: SparqlBinding[], keysInOrder: string[]): string[][] {
    if (!results) return [];
    return results.map(row =>
        keysInOrder.map(key => row[key]?.value ?? '') // Extract value safely
    );
}
