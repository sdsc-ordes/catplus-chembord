<script lang="ts">
	import ContentLayout from '$lib/components/ContentLayout.svelte';
	import DisplayResults from '$lib/components/DisplayResults.svelte';
	import SparqlSearchForm from '$lib/components/SparqlSearchForm.svelte';
	import { type FilterCategory } from '$lib/config';

	let { data } = $props();

	const results = data.results;
	const picklists: Record<FilterCategory, string[]> = data.picklists;
	const initialFilters: Record<FilterCategory, string[]> = data.initialFilters;


	// Table Headers of Qlever Results
	const HeadersQleverResults: string[] = [
		"Campaign Path", "Campaign Name", "Reaction Type", "Reaction Type", "Chemicals (Name, Cas, Smiles)"
	]
</script>

{#snippet sidebar()}
<SparqlSearchForm
    picklists={picklists}
	initialFilters={initialFilters}
/>
{/snippet}

{#snippet main()}
<DisplayResults
    results={results}
	tableHeaders={HeadersQleverResults}
/>
{/snippet}

<ContentLayout {sidebar} {main} />
