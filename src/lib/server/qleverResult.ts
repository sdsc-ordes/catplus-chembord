import { type FilterCategory, SparqlFilterQueries, FilterCategoriesSorted } from '$lib/config';
import { logger } from '$lib/server/logger';

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
 * The keys match the FilterCategory constants.
 */
export interface SparqlFilters {
  DEVICES?: string[];
  CHEMICAL_NAME?: string[];
  CAS?: string[];
  REACTION_NAME?: string[];
  SMILES?: string[];
  REACTION_TYPE?: string[];
  CAMPAIGN_NAME?: string[];
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
    DEVICES: '?deviceTypes',
    CHEMICAL_NAME: '?chemicalNames',
    CAS: '?casNumbers',
    SMILES: '?smiless',
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
 * Builds the core subquery, optionally including pagination.
 * This avoids duplicating the large query block for the count.
 * @param pagination Optional pagination object. If not provided, LIMIT and OFFSET are omitted.
 * @returns The core subquery string.
 */
const buildCoreSubQuery = (
  filters: SparqlFilters, // Pass filters to it
  pagination?: SparqlPagination
): string => {

  // Dynamically create the pagination part of the query
  const paginationClause = pagination
    ? `
      ORDER BY ?contenturl
      LIMIT ${pagination.limit}
      OFFSET ${pagination.offset}
    `
    : '';

  // Generate internal filters
  const reactionTypeFilter = createInternalFilter('?reactionType', filters.REACTION_TYPE);
  const reactionNameFilter = createInternalFilter('?reactionName', filters.REACTION_NAME);
  const campaignNameFilter = createInternalFilter('?campaignName', filters.CAMPAIGN_NAME);

  // Return the complete subquery template
  return `
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
        # Step 1: Pagination (conditionally applied)
        {
          SELECT DISTINCT ?contenturl
          WHERE {
            ?LiquidChromatographyAggregateDocument schema:contentUrl ?contenturl .
            ?LiquidChromatographyAggregateDocument a allo-res:AFR_0002524 .
          }
          ${paginationClause}
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
};

export const createSparqlQuery = (
  filters: SparqlFilters,
  pagination: SparqlPagination
): ResultQueries => {
  logger.debug({filters, pagination}, 'Creating SPARQL query with filters and pagination:');

  const outerFilterClause = createOuterFilter(filters);
  logger.debug({outerFilterClause}, 'Outer filter clause:');

  // Build the subquery WITH pagination for fetching results
  const coreSubQueryForResults = buildCoreSubQuery(filters, pagination);

  // Build the subquery WITHOUT pagination for the count
  const coreSubQueryForCount = buildCoreSubQuery(filters);

  const resultsQuery = `
    ${SPARQL_PREFIXES}
    SELECT
      ?contenturl ?deviceTypes ?chemicals ?peakIdentifiers
    WHERE {
      ${outerFilterClause}
      ${coreSubQueryForResults}
    }
    ORDER BY ASC(?contenturl)
  `;

  const countQuery = `
    ${SPARQL_PREFIXES}
    SELECT (COUNT(*) AS ?count)
    WHERE {
      ${outerFilterClause}
      ${coreSubQueryForCount}
    }
  `;
  logger.debug({resultsQuery}, 'Generated results query:');
  logger.debug({countQuery}, 'Generated count query:');

  return {
    resultsQuery: resultsQuery,
    countQuery: countQuery,
    displayQuery: resultsQuery,
  };
};
