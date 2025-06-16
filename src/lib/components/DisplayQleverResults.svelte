<script lang="ts" generics="ResultItemType extends ResultItemBase">
	import Campaign from '$lib/components/Campaign.svelte';
	import { publicConfig } from '$lib/config';
	import type { S3FileInfo } from '$lib/server/s3';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	import { base } from '$app/paths';

	interface ResultItemBase {
		prefix: string;
	}

	// get props from data loader
	let {
		results,
		resultsTotal,
		tableHeaders,
		handlePageChange,
	} = $props();

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
        activeResultItem = result;
        if (result && result.prefix) {
            fetchDetails(result.prefix);
        } else {
            // Reset main content if row is invalid or deselected (if implementing deselection)
            detailedContent = null;
            isLoadingDetails = false;
            detailError = null;
        }
	}

    $effect(() => {
		// This effect runs whenever the `results` array changes
		if (results && results.length > 0) {
			// Automatically select the first item of the list
			const firstItem = results[0];
			handleRowClick(firstItem);
		} else {
			// If the new page has no results, clear the details view
			activeResultItem = null;
			detailedContent = null;
		}
    });
</script>

<div class="bg-tertiary-50-800 space-y-4 rounded p-4">
	<div class="table-wrap bg-tertiary-50-800 overflow-x-auto rounded-lg shadow">
		<table class="table caption-bottom">
			<thead>
				<tr>
					{#each headers as header}
					<th>{header}</th>
					{/each}
				</tr>
			</thead>
			<tbody class="[&>tr]:hover:bg-tertiary-100-900">
				{#each results as result, i}
					<tr
						onclick={() => handleRowClick(result)}
						class="cursor-pointer"
						class:bg-tertiary-200-800={activeResultItem?.prefix === result.prefix}
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
