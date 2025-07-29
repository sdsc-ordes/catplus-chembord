import { AppServerConfig } from '$lib/server/environment';
import { parseCsvToObjects, parseTolist } from '$lib/utils/csvParser';
import { logger } from './logger';

export type QueryResult =
  | { success: true; data: string }
  | { success: false; error: { message: string; statusCode?: number } };

/**
 * Executes a SPARQL query against the QLever endpoint and returns the result as a Turtle string.
 *
 * @param sparqlQuery The SPARQL query string (e.g., "CONSTRUCT {?s ?p ?o} WHERE {?s ?p ?o} LIMIT 10").
 * @returns A Promise that resolves to the a text/csv response string.
 * @throws Will throw an error if the fetch operation fails or if the server returns a non-OK status.
 */
async function queryQlever(query: string): Promise<string> {
    const encodedQuery = encodeURIComponent(query);
    logger.debug({ encodedQuery }, 'Encoded SPARQL query for Qlever');

    const fullUrl = `${AppServerConfig.QLEVER.QLEVER_API_URL}?query=${encodedQuery}`;
    logger.info({ fullUrl }, 'Full URL for Qlever query');

    try {
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Accept': 'text/csv',
            },
        });
        logger.info({ response }, 'Response from Qlever query');
        if (!response.ok) {
            const errorBody = await response.text();
            // Return a structured error object instead of throwing
            logger.error({ response }, `Error on query: ${query}`);
            return {
                success: false,
                error: {
                    message: `Qlever query failed: ${response.statusText}. Body: ${errorBody.substring(0, 500)}`,
                    statusCode: response.status,
                },
            };
        }
        logger.info({ response }, `Qlever query executed successfully: ${query}`);
        const resultData = await response.text();
        // Return a structured success object
        return { success: true, data: resultData };

    } catch (error: any) {
        logger.error({ query, error: {
            message: error.message,
            name: error.name,
            stack: error.stack,
            cause: error.cause,
        }, url: AppServerConfig.QLEVER.QLEVER_API_URL }, `Qlever error on query: ${query}`);
        return {
            success: false,
            error: {
                message: `Failed to execute Qlever query: ${error.message}`,
            },
        };
    }
}

/**
 * Fetch objects via a Sparql Query from qlever
 *
 * @param locals The SvelteKit locals object, containing the qlever service.
 * @param query The SPARQL query
 * @returns A Promise that resolves to an array of unique string values, or an empty array on error/no data.
 */
export async function getSparqlQueryResult(
    query: string,
): Promise<Record<string, string>[]> {
    if (!query) {
        console.warn('getSparqlQueryResult: query is missing.');
        return [];
    }
    try {
        const result = await queryQlever(query);
        const resultObjects: Record<string, string>[] = parseCsvToObjects(result);
        return resultObjects;
    } catch (error: any) {
        throw new Error(`Failed to execute Qlever query"${query}: ${error.message}`);
    }
}

/**
 * Fetches the search options via a SPARQL query from Qlever and
 * returns them as list of strings.
 *
 * @param query The SPARQL query
 * @returns A Promise that returns a list of options
 */
export async function getSearchOptionsList(
    query: string,
): Promise<string[]> {
    if (!query) {
        console.warn('getSearchOptionsList:  query is missing.');
        return [];
    }

    try {
        const csvResultString = await queryQlever(query);
        const options = parseTolist(csvResultString);
        return options;
    } catch (error: any) {
        throw new Error(`Failed to execute Qlever query"${query}: ${error.message}`);
    }
}
