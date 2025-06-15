<script lang="ts" generics="ResultItemType extends ResultItemBase">
	import Campaign from '$lib/components/Campaign.svelte';
	import { publicConfig } from '$lib/config';
	import type { S3FileInfo } from '$lib/server/s3';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ExternalLink } from '@lucide/svelte';

	interface ResultItemBase {
		prefix: string;
	}

	// get props from data loader
	let {
		results,
		resultsTotal,
		tableHeaders,
		query,
	} = $props();
	console.log(typeof(resultsTotal));

	const headers = ["Campaign"].concat(Object.values(tableHeaders));

	// Pagination of Campaigns
	let currentPage = $state(1);
	let pageSize = publicConfig.PUBLIC_RESULTS_PER_PAGE;

	// State for the fetched detailed data for the main content
	let detailedContent = $state<S3FileInfo[] | null>(null);
	let isLoadingDetails = $state(false);
	let detailError = $state<string | null>(null);
	let activeResultItem = $state<ResultItemType | null>(null);

    async function fetchDetails(campaignPath: string) {
        isLoadingDetails = true;
        detailError = null;
        detailedContent = null;
        try {
            // Adjust the URL to your actual API endpoint structure
            const response = await fetch(`${base}/api/${campaignPath}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message || `Failed to fetch details. Status: ${response.status}`);
            }
            const fetchedDetails: S3FileInfo[] = await response.json();
            detailedContent = fetchedDetails;
        } catch (err: any) {
            console.error('Error fetching details:', err);
            detailError = err.message || 'An unknown error occurred.';
        } finally {
            isLoadingDetails = false;
        }
    }

    function handleRowClick(result: ResultItemType) {
        activeResultItem = result; // Visually mark as active in sidebar
        if (result && result.prefix) {
            fetchDetails(result.prefix); // Fetch full details for the main content
        } else {
            // Reset main content if row is invalid or deselected (if implementing deselection)
            detailedContent = null;
            isLoadingDetails = false;
            detailError = null;
        }
	}

	async function handlePageChange(e: CustomEvent<{ page: number }>) {
		console.log("handle page change", e);
		// Get the current URL's search parameters
		const searchParams = new URLSearchParams(page.url.search);

		// Set the new offset and ensure page is updated for the pagination component
		searchParams.set('page', e.page);

		// Navigate to the new URL and force all `load` functions to re-run.
		// This is the key to "reloading" the data for the new page.
		await goto(`?${searchParams.toString()}`);
	}

    $effect(() => {
        if (results.length > 0 && activeResultItem === null) {
            const firstItem = results[0];
            handleRowClick(firstItem); // Use your existing handler
        }
    });

	// Encode the query string for display
	const encodedQuery = encodeURIComponent(query);
	const qleverUrl = `${publicConfig.PUBLIC_QLEVER_UI_URL}?query=${encodedQuery}`;
	console.log(qleverUrl);
</script>

<div class="bg-tertiary-50 space-y-4 rounded p-4">
	<h1 class="bg-tertiary-50 mb-4 p-4 text-2xl font-bold text-gray-800">
		Results ({resultsTotal})
	</h1>
	<a
	    href={qleverUrl}
		target="_blank"
		class="inline-flex items-center text-primary-500 hover:text-primary-600 align-baseline"
	>
	    query in Qlever UI
		<ExternalLink class="h-4 w-4" />
	</a>
	<div class="text-xs font-mono bg-white"><pre><code>{query}</code></pre></div>
	<div class="table-wrap bg-tertiary-50 overflow-x-auto rounded-lg shadow">
		<table class="table caption-bottom">
			<thead>
				<tr>
					{#each headers as header}
					<th>{header}</th>
					{/each}
				</tr>
			</thead>
			<tbody class="[&>tr]:hover:bg-tertiary-100">
				{#each results as result, i}
					<tr
						onclick={() => handleRowClick(result)}
						class="cursor-pointer"
						class:bg-tertiary-200={activeResultItem?.prefix === result.prefix}
					>
					{#each Object.values(result) as value, key}
						<td>
							{#if Array.isArray(value)}
								<ul class="list-disc pl-5">
									{#each value as item}
										<li>{item}</li>
									{/each}
								</ul>
							{:else}
								{value}
							{/if}
						</td>
					{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<footer class="">
		<Pagination
			data={results}
			{currentPage}
			onPageChange={(e) => handlePageChange(e)}
			pageSize={pageSize}
			siblingCount={4}
			count={resultsTotal}
			alternative
		/>
	</footer>
</div>
<Campaign
	isLoading={isLoadingDetails}
	error={detailError}
	campaignFiles={detailedContent?.files}
	activeCampaign={activeResultItem?.prefix}
	title={activeResultItem?.prefix}
/>
