<script lang="ts">
	import { page as routePage } from '$app/state';
	import ContentLayout from '$lib/components/ContentLayout.svelte';
	import Results from '$lib/components/Results.svelte';
	import S3SearchForm from '$lib/components/S3SearchForm.svelte';
	import type { CampaignResult } from '$lib/schema/campaign.js';

	// Get prefix from parameters
	let prefix = routePage.url.searchParams.get('prefix') || 'batch/';

	// get props from data loader
	let { data } = $props();
	const results: CampaignResult[] = data.results;
</script>

{#snippet sidebar()}
<S3SearchForm
    prefix={prefix}
/>
{/snippet}

{#snippet main()}
<Results
    results={results}
/>
{/snippet}

<ContentLayout {sidebar} {main} />
