import { SparqlQueryConfig, type FilterCategory } from '$lib/config';
import { logger } from '$lib/server/logger';

export type FiltersObject = Partial<Record<FilterCategory, string[]>>;

export interface ResultQueryAndHeader {
    resultsQuery: string;
    countQuery: string;
    resultColumns: FilterCategory[];
    displayQuery: string;
};

/**
 * Creates a paginated and filterable SPARQL query dynamically.
 *
 * @param filters - An object of filter values.
 * @param resultColumns - The columns to be returned in the final result.
 * @param limit - The number of results per page.
 * @param offset - The starting offset for pagination.
 * @returns A string representing the SPARQL Query.
 */
export function createSparqlQueries(
    filters: FiltersObject,
    resultColumns: FilterCategory[],
    limit: number,
    offset: number
): ResultQueryAndHeader {

    const selectParts: string[] = [];
    const groupByVars: string[] = [];
    const outerWherePatterns = new Set<string>();
    const innerWherePatterns = new Set<string>();

    // Always include these base patterns for connecting data
    outerWherePatterns.add('?s cat:hasBatch ?batch .');
    outerWherePatterns.add(`{?s cat:hasChemical ?chemical . ?s a cat:Campaign}
    UNION {?action cat:hasBatch ?batch . ?action cat:hasSample* ?sample . ?sample cat:hasChemical ?chemical .}`);

    // Build the SELECT and GROUP BY clauses based on requested columns
    for (const column of resultColumns) {
        const config = SparqlQueryConfig[column];
        if (!config) continue;

        outerWherePatterns.add(config.pattern);
        selectParts.push(config.var);
        groupByVars.push(config.var);
    }

    // --- Build the subquery's FILTER conditions ---
    const filterConditions: string[] = [];
    for (const key in filters) {
        const category = key as FilterCategory;
        const filterValues = filters[category];
        const config = SparqlQueryConfig[category];

        if (config && filterValues && filterValues.length > 0) {
            // Add the necessary pattern to the *inner* query for filtering
            innerWherePatterns.add(config.pattern);
            // Use IN for multiple values, which is cleaner and more efficient
            const valuesString = filterValues.map(v => `'${v.replace(/'/g, "\\'")}'`).join(', ');
            filterConditions.push(`FILTER (${config.var} IN (${valuesString}))`);
        }
    }

    // --- Assemble the final query ---
    const prefixes = `
PREFIX allores: <http://purl.allotrope.org/ontologies/result#>
PREFIX cat: <http://example.org/catplus/ontology/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX schema: <https://schema.org/>
    `;

    // Add base patterns for the inner query to link data for filtering
    innerWherePatterns.add('?s rdf:type cat:Campaign .');
    innerWherePatterns.add('?s cat:hasBatch ?batch .');
    innerWherePatterns.add(`{?s cat:hasChemical ?chemical . ?s a cat:Campaign}
            UNION {?action cat:hasBatch ?batch . ?action cat:hasSample* ?sample . ?sample cat:hasChemical ?chemical .}`);
    // Add pattern for sorting
    innerWherePatterns.add('?s schema:contentUrl ?contentUrl .');


    const resultsQuery = `
${prefixes}
SELECT
    ?contentUrl
    ${selectParts.join('\n    ')}
WHERE {
    ?s schema:contentUrl ?contentUrl .
    ${Array.from(outerWherePatterns).join('\n    ')}
    {
        SELECT DISTINCT ?s WHERE {
            ${Array.from(innerWherePatterns).join('\n            ')}
            ${filterConditions.join('\n            ')}
        }
        ORDER BY ASC(?contentUrl)
        LIMIT ${limit}
        OFFSET ${offset}
    }
}
GROUP BY ?contentUrl ${groupByVars.join(' ')}
ORDER BY ASC(?contentUrl)
    `;
    const displayQuery = resultsQuery.trim();

    const countQuery = `
        ${prefixes}
        SELECT (COUNT(DISTINCT ?s) AS ?total)
        WHERE {
            ${Array.from(innerWherePatterns).join(' ')}
            ${filterConditions.join(' ')}
        }
    `;
    const cleanedResultsQuery = resultsQuery.replace(/\s+/g, ' ').trim();
    const cleanedCountQuery = countQuery.replace(/\s+/g, ' ').trim();

    return {
        resultsQuery: cleanedResultsQuery,
        countQuery: cleanedCountQuery,
        resultColumns: resultColumns,
        displayQuery: displayQuery,
    };
}
