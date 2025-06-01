import { BaseResultSparqlQuery, SparqlVariables, type FilterCategory } from '$lib/config';

export type FiltersObject = Partial<Record<FilterCategory, string[]>>;

/**
 * Creates a SPARQL filter string by joining multiple conditions with OR (||).
 *
 * @param filters - An object where keys are ResultTableColumnKey and values are arrays of strings to filter by.
 * Example: { CAMPAIGN_NAME: ['Caffeine Synthesis'], CAS: ['100-42-5', '108-88-3'] }
 * @returns A string representing the combined SPARQL FILTER conditions, joined by " || ".
 * Returns an empty string if no filters with values are provided.
 * Example: "?cp = 'Caffeine Synthesis' || ?ca = '100-42-5' || ?ca = '108-88-3'"
 */
export function createQueryFilter(
    filters: FiltersObject,
): string {
    const filterConditions: string[] = [];

    // Iterate over the keys present in the input filters object
    for (const key in filters) {
        // Check if the key is a genuine property of the filters object
        if (Object.prototype.hasOwnProperty.call(filters, key)) {
            // Cast the key to our defined type for type safety
            const columnKey = key as ResultTableColumnKey;

            // Get the array of filter values for the current column/key
            const values = filters[columnKey];
            // Get the corresponding SPARQL variable name from the map
            const sparqlVar = SparqlVariables[columnKey];

            // Proceed only if we have a SPARQL variable and some values to filter by
            if (sparqlVar && values && values.length > 0) {
                values.forEach(value => {
                    // Escape single quotes within the filter value to prevent SPARQL syntax errors
                    // e.g., "O'Reilly" becomes "O\'Reilly"
                    const escapedValue = value.replace(/'/g, "\\'");
                    // Construct the individual filter condition
                    filterConditions.push(`?${sparqlVar} = '${escapedValue}'`);
                });
            }
        }
    }
    if (filterConditions.length === 0) {
        return `${BaseResultSparqlQuery.baseClause}${BaseResultSparqlQuery.orderByClause}`;
    }

    // Join all collected conditions with " || "
    const filterClause = filterConditions.join(' || ');
    return `${BaseResultSparqlQuery.baseClause} FILTER (${filterClause}) ${BaseResultSparqlQuery.orderByClause}`;
}