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
	const HeadersS3Results: string[] = ["Campaign", "Date"]
</script>

{#snippet sidebar()}
	<S3SearchForm
		prefix={prefix}
	/>
{/snippet}

{#snippet main()}
	<ResultsHeaderData
		resultsTotal={resultsTotal}
	/>

	{#if resultsTotal}
		<DisplayS3Results
			results={results}
			resultsTotal={resultsTotal}
			tableHeaders={HeadersS3Results}
		/>
	{/if}
{/snippet}

<ContentLayout {sidebar} {main} />
