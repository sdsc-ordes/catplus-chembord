/**
 * @file SPARQL query builder for fetching liquid chromatography results.
 * @description This file contains the necessary components to dynamically construct
 * a SPARQL query with filters and pagination.
 */

/**
 * Defines the structure for pagination options.
 */
export interface SparqlPagination {
  limit: number;
  offset: number;
}

/**
 * Defines the available filter options for the SPARQL query.
 * Each property is an optional array of strings to allow for multiple values per filter.
 */
export interface SparqlFilters {
  deviceType?: string[];
  chemicalName?: string[];
  casNumber?: string[];
  reactionName?: string[];
  smiles?: string[];
  reactionType?: string[];
}

/**
 * A constant holding all the required SPARQL prefixes.
 * This keeps the main query template cleaner.
 */
const SPARQL_PREFIXES = `
PREFIX res: <http://dbpedia.org/resource/>
PREFIX allo-res: <http://purl.allotrope.org/ontologies/result#>
PREFIX schema: <https://schema.org/>
PREFIX cat: <http://example.org/catplus/ontology/>
PREFIX purl: <http://purl.allotrope.org/ontologies/>
`;

/**
 * Helper function to generate a FILTER IN clause if values are present.
 * @param variableName - The SPARQL variable to filter (e.g., "?reactionName").
 * @param values - The array of string values to filter by.
 * @returns A FILTER clause string or an empty string.
 */
const createFilterClause = (variableName: string, values?: string[]): string => {
  if (values && values.length > 0) {
    const formattedValues = values.map(v => `"${v}"`).join(', ');
    return `FILTER (${variableName} IN (${formattedValues}))`;
  }
  return '';
};

/**
 * Creates a complete SPARQL query string with dynamic filters and pagination.
 *
 * @param filters - An object containing the filters to apply. Each filter can have multiple values.
 * @param pagination - An object containing limit and offset for pagination.
 * @returns A complete SPARQL query as a string.
 */
export const createSparqlQuery = (
  filters: SparqlFilters,
  pagination: SparqlPagination
): string => {
  // Start with the prefixes
  let query = SPARQL_PREFIXES;

  // Build the main query body using a template literal
  query += `
SELECT DISTINCT ?contenturl ?deviceTypes ?chemicals ?peakIdentifiers
WHERE {

  # Step 1: Pagination of contenturl, incorporating dynamic limit and offset
  {
    SELECT DISTINCT ?contenturl
    WHERE {
      ?LiquidChromatographyAggregateDocument schema:contentUrl ?contenturl .
      ?LiquidChromatographyAggregateDocument a allo-res:AFR_0002524 .
    }
    ORDER BY ?contenturl
    LIMIT ${pagination.limit}
    OFFSET ${pagination.offset}
  }
  OPTIONAL {
    SELECT ?contenturl (GROUP_CONCAT(DISTINCT ?deviceType; separator="; ") AS ?deviceTypes )
    WHERE {
      ?LiquidChromatographyAggregateDocument schema:contentUrl ?contenturl ;
        allo-res:AFR_0002526 ?DeviceSystemDocument ;
        cat:hasLiquidChromatography/allo-res:AFR_0002374 ?MeasurementAggregateDocument .

      ?DeviceSystemDocument a cat:DeviceSystemDocument ;
        allo-res:AFR_0002722/allo-res:AFR_0002568 ?deviceType .

      ?MeasurementAggregateDocument allo-res:AFR_0002083 ?SampleDocument .

      ?SampleDocument cat:hasProduct ?product .

      ?synthAddAction cat:producesProduct ?product ;
                      cat:hasBatch ?batch .

      ?batch cat:reactionType ?reactionType ;
             cat:reactionName ?reactionName .
    }
    GROUP BY ?contenturl
  }
  OPTIONAL {
    SELECT ?contenturl (GROUP_CONCAT(DISTINCT CONCAT(?chemicalName, " [", ?casNumber, "] <", ?smiles, ">"); separator=" | ") AS ?chemicals)
    WHERE {
      ?LiquidChromatographyAggregateDocument schema:contentUrl ?contenturl ;
        cat:hasLiquidChromatography/allo-res:AFR_0002374 ?MeasurementAggregateDocument .

      ?MeasurementAggregateDocument allo-res:AFR_0002083 ?SampleDocument .
      ?SampleDocument cat:hasSample* ?sample .

      ?chemical allo-res:AFR_0002292 ?chemicalName ;
                cat:casNumber ?casNumber ;
                allo-res:AFR_0002295 ?smiles .
    }
    GROUP BY ?contenturl
  }
  OPTIONAL {
    SELECT ?contenturl (GROUP_CONCAT(DISTINCT ?peakIdentifier; separator="; ") AS ?peakIdentifiers)
    WHERE {
      ?LiquidChromatographyAggregateDocument schema:contentUrl ?contenturl ;
        cat:hasLiquidChromatography/allo-res:AFR_0002374 ?MeasurementAggregateDocument .

      ?MeasurementAggregateDocument allo-res:AFR_0002659/allo-res:AFR_0000432/cat:peak/allo-res:AFR_0001164 ?peakIdentifier .
    }
    GROUP BY ?contenturl
  }
  # Apply all filters here
  ${createFilterClause('?deviceType', filters.deviceType)}
  ${createFilterClause('?reactionType', filters.reactionType)}
  ${createFilterClause('?reactionName', filters.reactionName)}
  ${createFilterClause('?chemicalName', filters.chemicalName)}
  ${createFilterClause('?casNumber', filters.casNumber)}
  ${createFilterClause('?smiles', filters.smiles)}
}
ORDER BY ASC(?contenturl)
`;

  return query;
};

// --- Example Usage ---

// 1. Define your filters and pagination with arrays for values
const myFilters: SparqlFilters = {
  reactionName: ["Caffeine synthesis", "Another Reaction"],
  chemicalName: ["methyl iodide"],
  reactionType: ["N-methylation"],
};

const myPagination: SparqlPagination = {
  limit: 25,
  offset: 0,
};

// 2. Generate the query
const generatedQuery = createSparqlQuery(myFilters, myPagination);

// 3. Log the result to see the generated query
console.log(generatedQuery);
