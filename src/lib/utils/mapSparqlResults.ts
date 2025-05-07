// Define the structure of a single raw SPARQL result binding
export interface SparqlBinding {
    [key: string]: { type: 'uri' | 'literal' | 'bnode'; value: string; datatype?: string; 'xml:lang'?: string };
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
