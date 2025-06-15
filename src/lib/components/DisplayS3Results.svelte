<script lang="ts" generics="ResultItemType extends ResultItemBase">
	import IconArrowLeft from '@lucide/svelte/icons/arrow-left';
	import IconArrowRight from '@lucide/svelte/icons/arrow-right';
	import IconEllipsis from '@lucide/svelte/icons/ellipsis';
	import IconFirst from '@lucide/svelte/icons/chevrons-left';
	import IconLast from '@lucide/svelte/icons/chevron-right';
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
		tableHeaders
	} = $props();

	// Pagination of Campaigns
	let page = $state(1);
	let size = publicConfig.PUBLIC_RESULTS_PER_PAGE;
	const slicedResults = $derived((r: ResultItemType[]) => r.slice((page - 1) * size, page * size));

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

	function handlePageChange(e: Event) {
		page = e.page;
		activeResultItem = slicedResults(results)[0];
		handleRowClick(activeResultItem);
	}

    $effect(() => {
        if (results.length > 0 && activeResultItem === null) {
            const firstItem = results[0];
            handleRowClick(firstItem); // Use your existing handler
        }
    });
</script>

<div class="bg-tertiary-50 space-y-4 rounded p-4">
	<div class="table-wrap bg-tertiary-50 overflow-x-auto rounded-lg shadow">
		<table class="table caption-bottom">
			<thead>
				<tr>
					{#each tableHeaders as header}
					<th>{header}</th>
					{/each}
				</tr>
			</thead>
			<tbody class="[&>tr]:hover:bg-tertiary-100">
				{#each slicedResults(results) as result, i}
					<tr
						onclick={() => handleRowClick(result)}
						class="cursor-pointer"
						class:bg-tertiary-200={activeResultItem?.prefix === result.prefix}
					>
					{#each Object.values(result) as value, key}
						<td>
							{value}
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
			{page}
			onPageChange={handlePageChange}
			pageSize={size}
			siblingCount={4}
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
