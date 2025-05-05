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
		//console.log(formData);

		// --- Use getAll() to retrieve all checked values for each category ---
		const selectedChemicals = formData.getAll('selected_chemicals') as string[];
		const selectedCampaignNames = formData.getAll('selected_campaign_names') as string[];
		const selectedReactionTypes = formData.getAll('selected_reaction_types') as string[];
		const selectedReactionNames = formData.getAll('selected_reaction_names') as string[];
		const selectedCas = formData.getAll('selected_cas') as string[];
		const selectedSmiles = formData.getAll('selected_smiles') as string[];

		// --- Construct Redirect URL ---
		// Create a URL object based on the current page's URL (path only, discarding old params)
		const targetUrl = new URL(url.origin + url.pathname); // Start fresh with path

		// --- Append parameters for multi-value fields ---
		selectedChemicals.forEach(value => targetUrl.searchParams.append('chemical', value));
		selectedCampaignNames.forEach(value => targetUrl.searchParams.append('campaign', value));
		selectedReactionTypes.forEach(value => targetUrl.searchParams.append('reaction_type', value));
		selectedReactionNames.forEach(value => targetUrl.searchParams.append('reaction_name', value));
		selectedCas.forEach(value => targetUrl.searchParams.append('cas', value));
		selectedSmiles.forEach(value => targetUrl.searchParams.append('smiles', value));

		// --- Redirect ---
		// Use status 303 (See Other) for POST -> GET redirect pattern
		throw redirect(303, targetUrl.toString());
	}
	// Add other actions if needed
};
