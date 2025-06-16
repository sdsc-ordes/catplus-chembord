<script lang="ts">
	import { page as routePage } from '$app/state';
	import ContentLayout from '$lib/components/ContentLayout.svelte';
	import DisplayS3Results from '$lib/components/DisplayS3Results.svelte';
	import S3SearchForm from '$lib/components/S3SearchForm.svelte';
	import ResultsHeaderData from '$lib/components/ResultsHeaderData.svelte';
	import type { CampaignResult } from '$lib/utils/groupCampaigns.js';

	// Get prefix from parameters
	let prefix = routePage.url.searchParams.get('prefix') || 'batch/';

	// get props from data loader
	let { data } = $props();
	const results: CampaignResult[] = data.results;
	const resultsTotal: number = data.resultTotal;

	// Result Display
	const HeadersS3Results: string[] = ["Date"]

	function handlePageChange(e: Event) {
		console.log("page change")
	}
</script>

{#snippet sidebar()}
<S3SearchForm
    prefix={prefix}
/>
{/snippet}

{#snippet main()}
<ResultsHeaderData
    resultsTotal={results.length}
/>
<DisplayS3Results
	results={results}
	resultsTotal={resultsTotal}
	tableHeaders={HeadersS3Results}
	handlePageChange={handlePageChange}
/>
{/snippet}

<ContentLayout {sidebar} {main} />
