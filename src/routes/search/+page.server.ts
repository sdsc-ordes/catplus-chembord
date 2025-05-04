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
