<script lang="ts">
	let { data } = $props();
	import { page as routePage } from '$app/state';
	import ContentLayout from '$lib/components/ContentLayout.svelte';
	import IconArrowLeft from '@lucide/svelte/icons/arrow-left';
	import IconArrowRight from '@lucide/svelte/icons/arrow-right';
	import IconEllipsis from '@lucide/svelte/icons/ellipsis';
	import IconFirst from '@lucide/svelte/icons/chevrons-left';
	import IconLast from '@lucide/svelte/icons/chevron-right';
	import Campaign from '$lib/components/Campaign.svelte';
	import { campaignsPerPage} from '$lib/const/campaign';
	import { extractDateFromPath } from '$lib/utils/displayFolder'
	import type { S3FileInfo } from '$lib/schema/s3.js';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	import S3SearchForm from '$lib/components/S3SearchForm.svelte';

	let prefix = routePage.url.searchParams.get('prefix') || 'batch/';
	interface SourceData {
		campaign: string;
	}
	let sourceData: SourceData[] = data.foldersWithFiles.map(folderElement => {
		return { campaign: folderElement.prefix };
	});

    interface SidebarRowData {
        campaign: string;
    }

	// State
	let page = $state(1);
	let size = campaignsPerPage;
	const slicedSource = $derived((s: SourceData[]) => s.slice((page - 1) * size, page * size));

	// State for the fetched detailed data for the main content
	let detailedContent = $state<S3FileInfo[] | null>(null);
	let isLoadingDetails = $state(false);
	let detailError = $state<string | null>(null);
	let activeSidebarItem = $state<SidebarRowData | null>(null);

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

    function handleRowClick(row: SidebarRowData) {
        activeSidebarItem = row; // Visually mark as active in sidebar
        if (row && row.campaign) {
            fetchDetails(row.campaign); // Fetch full details for the main content
        } else {
            // Reset main content if row is invalid or deselected (if implementing deselection)
            detailedContent = null;
            isLoadingDetails = false;
            detailError = null;
        }
	}

	function handlePageChange(e: Event) {
		page = e.page;
		activeSidebarItem = slicedSource(sourceData)[0];
		console.log("page change", e);
		handleRowClick(activeSidebarItem);
	}

    $effect(() => {
        if (sourceData.length > 0 && activeSidebarItem === null) {
            const firstItem = sourceData[0];
            handleRowClick(firstItem); // Use your existing handler
        }
    });
	$inspect(detailedContent)
</script>

{#snippet sidebar()}
<S3SearchForm
   prefix={prefix}
/>
{/snippet}

{#snippet main()}
<div class="bg-tertiary-50 rounded space-y-4 p-4">
	<h1 class="mb-4 p-4 text-2xl bg-tertiary-50 font-bold text-gray-800">Results ({sourceData.length})</h1>
	<div class="table-wrap bg-tertiary-50">
		<table class="table table-fixed caption-bottom">
			<thead>
				<tr>
					<th>Campaign Path</th>
					<th>Date</th>
				</tr>
			</thead>
			<tbody class="[&>tr]:hover:bg-tertiary-100">
				{#each slicedSource(sourceData) as row, i}
					<tr
					onclick={() => handleRowClick(row)}
					class="cursor-pointer"
					class:bg-tertiary-200={activeSidebarItem?.campaign === row.campaign}
					>
						<td>
							{row.campaign}
						</td>
						<td>
							{extractDateFromPath(row.campaign)}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<footer class="">
		<Pagination
			data={sourceData}
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
	activeCampaign={activeSidebarItem?.campaign}
	title={activeSidebarItem?.campaign}
/>
{/snippet}

<ContentLayout {sidebar} {main} />
