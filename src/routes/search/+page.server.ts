import { logger } from '$lib/server/logger';
import type { PageServerLoad } from './$types';
import { getSearchOptionsList, getSparqlQueryResult } from '$lib/server/qlever';
import { type FilterCategory, SparqlFilterQueries, FilterCategoriesSorted } from '$lib/config';
import { createSparqlQuery } from '$lib/server/qleverResult';
import type { SparqlPagination, SparqlFilters } from '$lib/server/qleverResult';
import { publicConfig } from '$lib/config';
import { redirect } from '@sveltejs/kit';
import { transformQueryResultRow } from '$lib/utils/resultTransformer';


export const load: PageServerLoad = async ({ url }) => {
    try {
        //------------------------ Prepare the search form select options ------------------------
        const picklistPromises = Object.entries(SparqlFilterQueries).map(async ([optionName, query]) => {
            const picklist = await getSearchOptionsList(query);
            return { key: optionName, options: picklist };
        });

        const picklistsArray = await Promise.all(picklistPromises);
        const pickListsMap = picklistsArray.reduce<Record<string, string[]>>((acc, currentItem) => {
            acc[currentItem.key] = currentItem.options;
            return acc;
        }, {});

        //------------------------ Get query parameters from search parameters ------------------------
        const initialFilters = Object.fromEntries(
            FilterCategoriesSorted.map((categoryKey) => [
                categoryKey,
                url.searchParams.getAll(categoryKey) || [],
            ])
        ) as Record<FilterCategory, string[]>;

        const currentPage = Math.max(1, parseInt(url.searchParams.get('page') as string, 10) || 1);
        const pageSize = publicConfig.PUBLIC_RESULTS_PER_PAGE;
        const offset = (currentPage - 1) * pageSize;

        //------------------------ Create and Execute Queries ------------------------
        // 1. Create the sparql query strings
		const sparqlFilters = initialFilters as SparqlFilters;
		logger.debug({ sparqlFilters }, "Initial Filters for SPARQL Query");
		logger.debug({ currentPage, pageSize, offset }, "Pagination Parameters");
		const myPagination: SparqlPagination = {
			limit: pageSize,
			offset: offset,
		};
		const generatedQueries = createSparqlQuery(sparqlFilters, myPagination);
        logger.debug({ generatedQueries }, "Generated SPARQL Queries");

        // 2. Execute the queries to get the actual data
        // Use Promise.all to run the count and results queries in parallel
        const [countResult, queryResult] = await Promise.all([
            getSparqlQueryResult(generatedQueries.countQuery),
            getSparqlQueryResult(generatedQueries.resultsQuery)
        ]);
		logger.info({ countResult }, "Count Result:");
		logger.debug({ queryResult }, "Query Result:");

        // 3. Process the results to define your variables
		const resultColumns = ["Campaign", "Product", "Devices", "Chemicals"];

		const results = queryResult.map(transformQueryResultRow);

		// The 'results' variable now holds your array of transformed dictionaries.
		logger.info({ results }, "Processed and transformed SPARQL results");

		// Return the actual data
        return {
            results: results,
            picklists: pickListsMap,
            initialFilters: initialFilters,
            resultColumns: resultColumns,
            resultsTotal: countResult,
            sparqlQuery: generatedQueries.displayQuery, // Return the query for display/debugging
            currentPage: currentPage,
            pageSize: pageSize,
        };

    } catch (error) {
        logger.error(error, "An error occurred in the search page load function.");
        // Return a safe state in case of an error
        return {
            results: [],
            picklists: {},
            initialFilters: {},
            resultColumns: [],
            resultsTotal: 0,
            sparqlQuery: "Error generating query.",
            error: "Could not fetch results.",
        };
    }
};

export const actions: Actions = {
	/**
	 * Search: picks up the selected filters from the form and reloads the search page
	 *         using the chosen selection
	 */
	search: async ({ request, url }) => {

		//----------------- Collect form data
		const formData = await request.formData();

        // Convert the FormData to a plain object before logging
        const formDataObject = Object.fromEntries(formData);
        logger.debug({ formDataObject: formDataObject }, "data received on form submit");

		const searchParams = Object.fromEntries(
			FilterCategoriesSorted.map((categoryKey) => {
				const valuesFromForm = formData.getAll(categoryKey);
				let finalValues: string[] = [];
				if (valuesFromForm.length === 1 && typeof valuesFromForm[0] === 'string' && valuesFromForm[0].includes(',')) {
					console.warn(`Received comma-separated string for ${categoryKey}. Splitting.`);
					finalValues = valuesFromForm[0].split(',').map(s => s.trim()).filter(Boolean);
				} else if (valuesFromForm.length > 0) {
					finalValues = valuesFromForm.filter(v => typeof v === 'string') as string[];
				}
				return [categoryKey, finalValues];
			})
		) as Record<FilterCategory, string[]>;

		logger.debug({ searchParams: searchParams }, "searchParams");

		//----------------- Build target url

		const targetUrl = new URL(url.origin + url.pathname);
		logger.debug({targetUrl: targetUrl.toString()}, "Target URL for search action");

		// Append the processed values to the url as query parameters
		for (const categoryKey of FilterCategoriesSorted) {
			if (searchParams[categoryKey].length > 0) {
				searchParams[categoryKey].forEach(value => {
					if (value) {
						targetUrl.searchParams.append(categoryKey, value);
					}
				});
			}
		}
		logger.debug({ searchParams: searchParams }, "searchParams");

		// Use status 303 for GET redirect pattern
		throw redirect(303, targetUrl.toString());
	}
};
