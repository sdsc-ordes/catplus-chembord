import type { PageServerLoad, Actions } from './$types';
import { mockPicklists, type mockPicklists, type SparqlResultRow, getMockSparqlResults} from '$lib/sparql/+server';


// Load function runs first, provides initial data and picklists
export const load: PageServerLoad = async ({ url }) => {
	// Extract initial filter values from URL if present (e.g., from bookmarks/refresh)
	const initialFilters = {
		campaignName: url.searchParams.get('campaignName') || '',
		chemicalName: url.searchParams.get('chemicalName') || '',
		smiles: url.searchParams.get('smiles') || '',
		cas: url.searchParams.get('cas') || '',
		reactionName: url.searchParams.get('reactionName') || '',
		reactionType: url.searchParams.get('reactionType') || '',
	};

	// Get initial results (could use initialFilters here for real query)
	const initialResults = getMockSparqlResults(initialFilters);

	console.log('Load: Providing initial results and picklists.');

	// Return initial results AND the picklists
	return {
		results: initialResults,
		picklists: mockPicklists, // Pass the whole picklist object
		initialFilters: initialFilters // Pass the filters used for this load
	};
};

export const actions: Actions = {
	// Use a named action matching your form's 'action' attribute
	// Or use 'default' if the form doesn't specify an action name
	search: async ({ request, url }) => {
		const formData = await request.formData();
		console.log(formData);
		//const prefix = formData.get('prefix') ||  'batch/';

		// --- Construct Redirect URL ---
		// Create a URL object based on the current page's URL
		//const targetUrl = new URL(url);

		// Set the desired search parameters
		//targetUrl.searchParams.set('prefix', prefix);

		//console.log("Target URL for redirect:", targetUrl.toString());

		// --- Redirect ---
		// Use status 303 (See Other) for POST -> GET redirect pattern
		//throw redirect(303, targetUrl.toString());
	}
	// Add other actions if needed
};
