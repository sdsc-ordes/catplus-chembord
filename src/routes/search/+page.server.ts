import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit';
import { getSearchOptionsList, getSparqlQueryResult } from '$lib/server/qlever';
import { type FilterCategory, SparqlFilterQueries, FilterCategoriesSorted } from '$lib/config';
import { createQueryFilter } from '$lib/utils/joinSparqlFilters';
import { groupMappedQleverResultsByPrefix} from '$lib/utils/mapSparqlResults';

export const load: PageServerLoad = async ({ locals, url }) => {
	// get selections from the url
	const initialFilters = Object.fromEntries(
		FilterCategoriesSorted.map((categoryKey) => {
			const categoryIntialFilters = url.searchParams.getAll(categoryKey) || [];
			return [categoryKey, categoryIntialFilters];
		})
	) as Record<FilterCategory, string[]>;

    // Use Promise.all to fetch all select options in parallel
    const picklistPromises = Object.entries(SparqlFilterQueries).map(async ([optionName, query]) => {
		const picklist = await getSearchOptionsList(
			query);
        return {
			key: optionName,
			options: picklist,
		};
    });

	// map select options to the category keys
    const picklistsArray = await Promise.all(picklistPromises);
	const pickListsMap = picklistsArray.reduce<Record<string, string[]>>((acc, currentItem) => {
		acc[currentItem.key] = currentItem.options;
		return acc;
	}, {});

	// create the sparql query with selected filters
	const sparqlQueryWithFilters = createQueryFilter(initialFilters);

	// execute sparql search on Qlever
	const sparqlResult: string = await getSparqlQueryResult(sparqlQueryWithFilters);

	// map the sparql result in the result table (with s3 prefixes)
	const resultTable = groupMappedQleverResultsByPrefix(sparqlResult);

	// Return results, selections and options
	return {
		results: resultTable,
		picklists: pickListsMap,
		initialFilters: initialFilters,
	};
};

export const actions: Actions = {
	/**
	 * Search: picks up the selected filters from the form and reloads the search page
	 *         using the chosen selection
	 */
	search: async ({ request, url }) => {
		const formData = await request.formData();

		const targetUrl = new URL(url.origin + url.pathname);

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

		// Use status 303 for GET redirect pattern
		throw redirect(303, targetUrl.toString());
	}
};
