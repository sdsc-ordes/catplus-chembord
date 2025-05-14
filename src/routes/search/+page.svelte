<script lang="ts">
	import ContentLayout from '$lib/components/ContentLayout.svelte';
	import { ResultTableHeaders } from '$lib/const/search';
	import DisplayResults from '$lib/components/DisplayResults.svelte';
	import SparqlSearchForm from '$lib/components/SparqlSearchForm.svelte';
	let { data } = $props();

	// Result table
	const results = data.results;
</script>

{#snippet sidebar()}
<SparqlSearchForm
    data={data}
/>
{/snippet}

{#snippet main()}
<DisplayResults
    results={results}
	tableHeaders={ResultTableHeaders}
/>
{/snippet}

<ContentLayout {sidebar} {main} />
