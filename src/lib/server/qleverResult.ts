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

/* Interface for result query. */
export interface ResultQueries {
    resultsQuery: string;
    countQuery: string;
    displayQuery: string;
};


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
  campaignName?: string[]; // Added for the new filter
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
 * Creates a FILTER clause with CONTAINS for a single variable.
 * @param variableName The SPARQL variable to filter.
 * @param values The values to check for.
 * @returns A FILTER clause string or an empty string.
 */
const createInternalFilter = (variableName: string, values?: string[]): string => {
  if (!values || values.length === 0) return '';
  const conditions = values.map(value => `CONTAINS(${variableName}, "${value}")`).join(' && ');
  return `FILTER(${conditions})`;
};

/**
 * Creates the complex outer FILTER clause that checks across multiple aggregated strings.
 * @param filters The filters object.
 * @returns A single, combined FILTER clause string.
 */
const createOuterFilter = (filters: SparqlFilters): string => {
  const variableMap: Record<string, string> = {
    deviceType: '?deviceTypes',
    chemicalName: '?chemicalNames',
    casNumber: '?casNumbers',
    smiles: '?smiless',
  };

  const allConditions = Object.entries(filters)
    .filter(([key]) => variableMap[key]) // Only include filters that have a mapping
    .flatMap(([key, values]) => {
      const variable = variableMap[key];
      // Create a CONTAINS check for each value provided for the filter
      return values.map(value => `CONTAINS(${variable}, "${value}")`);
    });

  if (allConditions.length === 0) return '';

  return `FILTER( ${allConditions.join(' && ')} )`;
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
): ResultQueries => {

  const outerFilterClause = createOuterFilter(filters);
  const reactionTypeFilter = createInternalFilter('?reactionType', filters.reactionType);
  const reactionNameFilter = createInternalFilter('?reactionName', filters.reactionName);
  const campaignNameFilter = createInternalFilter('?campaignName', filters.campaignName);

  const coreSubQuery = `
    {
      SELECT DISTINCT
        ?contenturl
        ?deviceTypes
        (GROUP_CONCAT(DISTINCT ?chemicalName; separator=" | ") AS ?chemicalNames)
        (GROUP_CONCAT(DISTINCT ?casNumber; separator=" | ") AS ?casNumbers)
        (GROUP_CONCAT(DISTINCT ?smiles; separator=" | ") AS ?smiless)
        (GROUP_CONCAT(DISTINCT CONCAT(?chemicalName, " [", ?casNumber, "] <", ?smiles, ">"); separator=" | ") AS ?chemicals)
        ?peakIdentifiers
      WHERE {
        # Step 1: Pagination of contenturl
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
        # Step 2: Get deviceType per contenturl
        {
          SELECT ?contenturl (GROUP_CONCAT(DISTINCT ?deviceType; separator="; ") AS ?deviceTypes)
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
            ${reactionTypeFilter}
            ${reactionNameFilter}
          }
          GROUP BY ?contenturl
        }
        # Step 3: Chemical info coming from campaigns and samples
        {
          SELECT ?contenturl ?chemical ?casNumber ?smiles ?chemicalName
          WHERE {
            ?LiquidChromatographyAggregateDocument schema:contentUrl ?contenturl ;
              cat:hasLiquidChromatography/allo-res:AFR_0002374 ?MeasurementAggregateDocument .
            ?MeasurementAggregateDocument allo-res:AFR_0002083 ?SampleDocument .
            ?SampleDocument cat:hasProduct ?product .
            ?synthaddaction cat:producesProduct ?product .
            ?synthaddaction cat:hasBatch ?batch .
            ?campaign cat:hasBatch ?batch .
            {
              ?synthaddaction cat:hasSample+ ?sample .
              ?sample cat:hasChemical ?chemical .
            }
            UNION {
              ?campaign cat:hasChemical ?chemical .
            }
            ?campaign schema:name ?campaignName .
            ${campaignNameFilter}
            ?chemical
              allo-res:AFR_0002292 ?chemicalName ;
              cat:casNumber ?casNumber ;
              allo-res:AFR_0002295 ?smiles .
          }
          GROUP BY ?contenturl ?chemical ?casNumber ?smiles ?chemicalName
        }
        # Step 4: Peak Identifiers
        {
          SELECT ?contenturl (GROUP_CONCAT(DISTINCT ?peakIdentifier; separator="; ") AS ?peakIdentifiers)
          WHERE {
            ?LiquidChromatographyAggregateDocument schema:contentUrl ?contenturl ;
              cat:hasLiquidChromatography/allo-res:AFR_0002374 ?MeasurementAggregateDocument .
            ?MeasurementAggregateDocument allo-res:AFR_0002659/allo-res:AFR_0000432/cat:peak/allo-res:AFR_0001164 ?peakIdentifier .
          }
          GROUP BY ?contenturl
        }
      }
      GROUP BY ?contenturl ?deviceTypes ?peakIdentifiers
    }
  `;

  const resultsQuery = `
    ${SPARQL_PREFIXES}
    SELECT
      ?contenturl ?deviceTypes ?chemicals ?peakIdentifiers
    WHERE {
      ${outerFilterClause}
      ${coreSubQuery}
    }
    ORDER BY ASC(?contenturl)
  `;

  const countQuery = `
    ${SPARQL_PREFIXES}
    SELECT (COUNT(*) AS ?count)
    WHERE {
      ${outerFilterClause}
      ${coreSubQuery}
    }
  `;

  return {
    resultsQuery: resultsQuery,
    countQuery: countQuery,
    displayQuery: resultsQuery,
  };
};
