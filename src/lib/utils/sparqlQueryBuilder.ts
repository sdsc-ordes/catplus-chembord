import { ResultSparqlQueryBlocks, SparqlVariables, type FilterCategory } from '$lib/config';
import { logger } from '$lib/server/logger';

export type FiltersObject = Partial<Record<FilterCategory, string[]>>;

export interface ResultQueryAndHeader {
    sparqlQuery: string;
    resultColumns: FilterCategory[];
};

/**
 * Creates the SPARQL query.
 *
 * @param filters - An object where keys are arrays of strings to filter by.
 * Example: { CAMPAIGN_NAME: ['Caffeine Synthesis'], CAS: ['100-42-5', '108-88-3'] }
 * @returns A string representing the SPARQL Query
 */
export function createFilterQuery(
    filters: FiltersObject,
): ResultQueryAndHeader {
    const filterConditions: string[] = [];
    const resultVariables: string[] = [];
    const resultColumns: FilterCategory[] = [];

    // Iterate over the keys present in the input filters object
    for (const key in filters) {
        // Check if the key is a genuine property of the filters object
        if (Object.prototype.hasOwnProperty.call(filters, key)) {
            const columnKey = key;
            const filterValues = filters[key as FilterCategory];
            const sparqlVar = SparqlVariables[columnKey as FilterCategory];

            // Proceed only if we have some values to filter by
            if (sparqlVar && filterValues && filterValues.length > 0) {
                resultVariables.push(`?${sparqlVar}`)
                resultColumns.push(key as FilterCategory);
                filterValues.forEach(value => {
                    // Escape single quotes within the filter value to prevent SPARQL syntax errors
                    const escapedValue = value.replace(/'/g, "\\'");
                    // Construct the individual filter condition
                    filterConditions.push(`?${sparqlVar} = '${escapedValue}'`);
                });
            }
        }
    }
    logger.debug(resultVariables, "resultVariables");
    const sparqlReturns = resultVariables ? resultVariables.join(' ') : '';
    const filterClause = filterConditions.length > 0
        ? `FILTER (${filterConditions.join(' || ')}) ${ResultSparqlQueryBlocks.filterClause}`
        : ResultSparqlQueryBlocks.filterClause;
    const prefixClause = ResultSparqlQueryBlocks.prefixClause
    const selectClause = `${ResultSparqlQueryBlocks.selectClause} ${sparqlReturns}`;
    const whereClause = `${ResultSparqlQueryBlocks.whereClause}`;

    const sparqlQuery = `${prefixClause} ${selectClause} ${whereClause} ${filterClause}`;
    return {
        sparqlQuery: sparqlQuery,
        resultColumns: resultColumns,
    };
}
