import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit';
import { getSearchOptionsList, getSparqlQueryResult } from '$lib/server/qlever';
import { type FilterCategory, SparqlFilterQueries, FilterCategoriesSorted } from '$lib/config';
import { createSparqlQueries } from '$lib/utils/sparqlQueryBuilder';
import { groupMappedQleverResultsByPrefix} from '$lib/utils/mapSparqlResults';
import { publicConfig } from '$lib/config';
import { logger } from '$lib/server/logger';

export const load: PageServerLoad = async ({ url }) => {
	try {
		//------------------------ Prepare the search form select options ------------------------
		// Use Promise.all to fetch all select options in parallel
		const picklistPromises = Object.entries(SparqlFilterQueries).map(async ([optionName, query]) => {
			const picklist = await getSearchOptionsList(
				query);
			return {
				key: optionName,
				options: picklist,
			};
		});

		// get picklists from Qlever as Array of objects with key and options as array of strings
		const picklistsArray = await Promise.all(picklistPromises);
		logger.debug({picklistsArray}, 'Fetched picklist data from Qlever.');

		// map to picklists dictionary with key: Array of options
		const pickListsMap = picklistsArray.reduce<Record<string, string[]>>((acc, currentItem) => {
			acc[currentItem.key] = currentItem.options;
			return acc;
		}, {});
		logger.debug({pickListsMap}, 'Mapped picklist');

		//------------------------ Get query parameters from search parameters ------------------------
		// get selections from the url
		const initialFilters = Object.fromEntries(
			FilterCategoriesSorted.map((categoryKey) => {
				const categoryIntialFilters = url.searchParams.getAll(categoryKey) || [];
				return [categoryKey, categoryIntialFilters];
			})
		) as Record<FilterCategory, string[]>;
		logger.debug({initialFilters: initialFilters}, 'Filters from URL search params');
		// get result columns from the url
		const resultColumns = url.searchParams.get('columns')?.split(',') || [];
		logger.debug({resultcolumns: resultColumns}, "Result columns from URL params")

		// current page
		const currentPage = Math.max(1, parseInt(url.searchParams.get('page') as string, 10) || 1);
		const pageSize = publicConfig.PUBLIC_RESULTS_PER_PAGE;
		const offset = (currentPage - 1)  * pageSize;
		logger.debug({currentPage, pageSize, offset}, "calculating pagination");

		// create the sparql query with selected filters
		const sparqlQueries = createSparqlQueries(
			initialFilters,
			resultColumns as FilterCategory[],
			pageSize,
			offset,
		);
		logger.debug({ sparqlQueries }, "Generated SPARQL Queries");

		// execute sparql search on Qlever
		const sparqlResult: Record<string, string>[] = await getSparqlQueryResult(
			sparqlQueries.resultsQuery
		);
		logger.debug({sparqlResult: sparqlResult}, 'Received sparqlResult from Qlever');

		// execute sparql search on Qlever
		const resultsCount: Record<string, string>[] = await getSparqlQueryResult(
			sparqlQueries.countQuery
		);
		logger.debug({resultCount: resultsCount}, 'Received result count from Qlever');
		const resultsTotal = parseInt(resultsCount[0].total, 0);

		// map the sparql result in the result table (with s3 prefixes)
		const resultTable = groupMappedQleverResultsByPrefix(sparqlResult, resultColumns);
		logger.debug({resultTable: resultTable}, 'grouped by campaign');

		// Return results, selections and options
		return {
			results: resultTable,
			picklists: pickListsMap,
			initialFilters: initialFilters,
			resultColumns: resultColumns,
			resultsTotal: resultsTotal,
			sparqlQuery: sparqlQueries.displayQuery,
		};
	} catch (err: any) {
		throw new Error(err)
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
