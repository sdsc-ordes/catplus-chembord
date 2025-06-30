<script lang="ts">
	import { page } from '$app/state';
	import ContentLayout from '$lib/components/ContentLayout.svelte';
	import DisplayS3Results from '$lib/components/DisplayS3Results.svelte';
	import S3SearchForm from '$lib/components/S3SearchForm.svelte';
	import ResultsHeaderData from '$lib/components/ResultsHeaderData.svelte';
	import type { CampaignResult } from '$lib/utils/groupCampaigns.js';

	let year = $derived(page.url.searchParams.get('year') || undefined);
	let month = $derived(page.url.searchParams.get('month') || undefined);
	let day = $derived(page.url.searchParams.get('day') || undefined);
	let number = $derived(page.url.searchParams.get('number') || undefined);

	let { data, form } = $props();
	const results: CampaignResult[] = $derived(data.results);
	const resultsTotal: number = $derived(data.resultTotal);

	// Result Display
	const HeadersS3Results: string[] = ["Campaign", "Date"]
</script>

{#snippet sidebar()}
	<S3SearchForm
		form={form}
		year={year}
		month={month}
		day={day}
		number={number}
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
