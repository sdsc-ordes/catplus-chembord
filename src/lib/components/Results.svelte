<script lang="ts">
	import { page as routePage } from '$app/state';
	import IconArrowLeft from '@lucide/svelte/icons/arrow-left';
	import IconArrowRight from '@lucide/svelte/icons/arrow-right';
	import IconEllipsis from '@lucide/svelte/icons/ellipsis';
	import IconFirst from '@lucide/svelte/icons/chevrons-left';
	import IconLast from '@lucide/svelte/icons/chevron-right';
	import Campaign from '$lib/components/Campaign.svelte';
	import { ResultsPerPage} from '$lib/const/campaign';
	import type { S3FileInfo } from '$lib/schema/s3.js';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	import type { CampaignResult } from '$lib/schema/campaign.js';

	// Get prefix from parameters
	let prefix = routePage.url.searchParams.get('prefix') || 'batch/';

	// get props from data loader
	let { results } = $props();
    $inspect(results)

	// Pagination of Campaigns
	let page = $state(1);
	let size = ResultsPerPage;
	const slicedResults = $derived((r: CampaignResult[]) => r.slice((page - 1) * size, page * size));

	// State for the fetched detailed data for the main content
	let detailedContent = $state<S3FileInfo[] | null>(null);
	let isLoadingDetails = $state(false);
	let detailError = $state<string | null>(null);
	let activeSidebarItem = $state<CampaignResult | null>(null);

    async function fetchDetails(path: string) {
        isLoadingDetails = true;
        detailError = null;
        detailedContent = null;
        try {
            // Adjust the URL to your actual API endpoint structure
            const response = await fetch(`/api/${path}`);
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

    function handleRowClick(result: CampaignResult) {
        activeSidebarItem = result; // Visually mark as active in sidebar
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
		activeSidebarItem = slicedResults(results)[0];
		handleRowClick(activeSidebarItem);
	}

    $effect(() => {
        if (results.length > 0 && activeSidebarItem === null) {
            const firstItem = results[0];
            handleRowClick(firstItem); // Use your existing handler
        }
    });
</script>

<div class="bg-tertiary-50 space-y-4 rounded p-4">
	<h1 class="bg-tertiary-50 mb-4 p-4 text-2xl font-bold text-gray-800">
		Results ({results.length})
	</h1>
	<div class="table-wrap bg-tertiary-50">
		<table class="table table-fixed caption-bottom">
			<thead>
				<tr>
					<th>Campaign Path</th>
					<th>Date</th>
				</tr>
			</thead>
			<tbody class="[&>tr]:hover:bg-tertiary-100">
				{#each slicedResults(results) as result, i}
					<tr
						onclick={() => handleRowClick(result)}
						class="cursor-pointer"
						class:bg-tertiary-200={activeSidebarItem?.prefix === result.prefix}
					>
						<td>
							{result.prefix}
						</td>
						<td>
							{result.date}
						</td>
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
		>
			{#snippet labelEllipsis()}<IconEllipsis class="size-4" />{/snippet}
			{#snippet labelNext()}<IconArrowRight class="size-4" />{/snippet}
			{#snippet labelPrevious()}<IconArrowLeft class="size-4" />{/snippet}
			{#snippet labelFirst()}<IconFirst class="size-4" />{/snippet}
			{#snippet labelLast()}<IconLast class="size-4" />{/snippet}
		</Pagination>
	</footer>
</div>
<Campaign
	isLoading={isLoadingDetails}
	error={detailError}
	campaignFiles={detailedContent?.files}
	activeCampaign={activeSidebarItem?.prefix}
	title={activeSidebarItem?.prefix}
/>
