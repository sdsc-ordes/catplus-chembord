import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { mockPicklists, type mockPicklists, type SparqlResultRow, getMockSparqlResults} from '$lib/sparql/+server';

// Load function runs first, provides initial data and picklists
export const load: PageServerLoad = async ({ url }) => {
	// --- Extract initial filter values from URL ---
	// Use getAll() for parameters that can have multiple values
	const initialFilters = {
		// Keep single value retrieval for single-value params if any
		// prefix: url.searchParams.get('prefix') || '', // Example if you had a prefix filter

		// Use getAll() for potentially multi-valued filters
		campaignName: url.searchParams.getAll('campaign') || [], // Use key set by action ('campaign')
		chemicalName: url.searchParams.getAll('chemical') || [], // Use key set by action ('chemical')
		smiles: url.searchParams.getAll('smiles') || [],
		cas: url.searchParams.getAll('cas') || [],
		reactionName: url.searchParams.getAll('reaction_name') || [],
		reactionType: url.searchParams.getAll('reaction_type') || [],
	};
	// Note: `getAll()` returns an empty array `[]` if the parameter is not present,
	// so the `|| []` fallback might be redundant but doesn't hurt.

	//console.log('Load: Initial filters from URL:', initialFilters);

	// Get initial results (pass the filters object to your query function)
	// Ensure getMockSparqlResults (or your real query function) can handle
	// filter values being arrays of strings.
	const initialResults = getMockSparqlResults(initialFilters);

	//console.log('Load: Providing initial results and picklists.');

	// Return initial results, picklists, and the filters used for this load
	return {
		results: initialResults,
		picklists: mockPicklists, // Pass the whole picklist object
		initialFilters: initialFilters // Pass the filters read from the URL
	};
};

export const actions: Actions = {
	// Assuming your form action is action="?/search"
	search: async ({ request, url }) => {
		const formData = await request.formData();
		console.log("Received FormData:", formData);

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
			// Get potential values using getAll first
			const valuesFromForm = formData.getAll(formName);
			let finalValues: string[] = [];

			if (valuesFromForm.length === 1 && typeof valuesFromForm[0] === 'string' && valuesFromForm[0].includes(',')) {
				console.warn(`Received comma-separated string for ${formName}. Splitting.`);
				finalValues = valuesFromForm[0].split(',').map(s => s.trim()).filter(Boolean);
			} else if (valuesFromForm.length > 0) {
				finalValues = valuesFromForm.filter(v => typeof v === 'string') as string[];
			}

			// Append the processed values
			if (finalValues.length > 0) {
				console.log(`Appending ${finalValues.length} value(s) for ${urlParamName}`);
				finalValues.forEach(value => {
					if (value) {
						targetUrl.searchParams.append(urlParamName, value);
					}
				});
			}
		}

		console.log("Target URL for redirect:", targetUrl.toString());

		// --- Redirect ---
		// Use status 303 (See Other) for POST -> GET redirect pattern
		throw redirect(303, targetUrl.toString());
	}
};
