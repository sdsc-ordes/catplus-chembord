import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { mockPicklists, getMockSparqlResults } from '$lib/sparql/+server';
import type { mockPicklists } from '$lib/sparql/+server';
import { flattenSparqlBinding, s3LinkToPrefix } from '$lib/utils/mapSparqlResults';
import type { SparqlBinding, FlatSparqlRow, SparqlSearchResult } from '$lib/schema/sparql'

export const load: PageServerLoad = async ({ url }) => {
	// the load function picks up the search filters from the url and loads the data
	const initialFilters = {
		campaignName: url.searchParams.getAll('campaign') || [],
		chemicalName: url.searchParams.getAll('chemical') || [],
		smiles: url.searchParams.getAll('smiles') || [],
		cas: url.searchParams.getAll('cas') || [],
		reactionName: url.searchParams.getAll('reaction_name') || [],
		reactionType: url.searchParams.getAll('reaction_type') || [],
	};
	// the query results are currently mocked and will later be received
	// from a Qlever backend
	const initialResults:SparqlBinding[] = getMockSparqlResults(initialFilters);
	console.log(initialResults);

	const results = initialResults
		.map(singleBinding => flattenSparqlBinding(singleBinding))
		.filter((item): item is FlatSparqlRow => item !== null)
		.map(item => {
			const { s3link, ...restOfProperties } = item;
			const newPrefix = s3LinkToPrefix(s3link);
			return {
				prefix: newPrefix,
				...restOfProperties
			};
		});

	// Return initial results, picklists, and the filters used for this load
	return {
		results: results,
		picklists: mockPicklists,
		initialFilters: initialFilters,
	};
};

export const actions: Actions = {
	// search picks up the filters from a form and reloads the search page with
	// the selected filters
	search: async ({ request, url }) => {
		const formData = await request.formData();

		// --- Define mapping from form input name to URL parameter name ---
		const filterMappings: Record<string, string> = {
			selected_chemicals: 'chemical',
			selected_campaign_names: 'campaign',
			selected_reaction_types: 'reaction_type',
			selected_reaction_names: 'reaction_name',
			selected_cas: 'cas',
			selected_smiles: 'smiles',
		};

		const targetUrl = new URL(url.origin + url.pathname);

		for (const [formName, urlParamName] of Object.entries(filterMappings)) {
			// Get potential values of the form data
			const valuesFromForm = formData.getAll(formName);
			let finalValues: string[] = [];

			if (valuesFromForm.length === 1 && typeof valuesFromForm[0] === 'string' && valuesFromForm[0].includes(',')) {
				console.warn(`Received comma-separated string for ${formName}. Splitting.`);
				finalValues = valuesFromForm[0].split(',').map(s => s.trim()).filter(Boolean);
			} else if (valuesFromForm.length > 0) {
				finalValues = valuesFromForm.filter(v => typeof v === 'string') as string[];
			}

			// Append the processed values to the url as query parameters
			if (finalValues.length > 0) {
				finalValues.forEach(value => {
					if (value) {
						targetUrl.searchParams.append(urlParamName, value);
					}
				});
			}
		}

		// Use status 303 for POST -> GET redirect pattern
		throw redirect(303, targetUrl.toString());
	}
};
