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
	import { groupFilesByCalculatedPrefix } from './groupFiles';
	import { type FolderGroup, FileTableHeaders, type FileInfo } from './types.d';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	import { formatBytes, formatDate} from '$lib/utils/displayFile';
	import { getZipFileName } from '$lib/utils/zipFileName';
	import { s3LinkToUrlPath } from '$lib/utils/s3LinkParser';
	import Archive from '@lucide/svelte/icons/archive';

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
	let size = $state(5);
	const slicedSource = $derived((s: SourceData[]) => s.slice((page - 1) * size, page * size));

	// State for the fetched detailed data for the main content
	let detailedContent = $state<FileInfo[] | null>(null);
	$inspect("detailedContent", detailedContent);
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
            const fetchedDetails: FileInfo[] = await response.json();
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
    $effect(() => {
        if (sourceData.length > 0 && activeSidebarItem === null) {
            const firstItem = sourceData[0];
            $inspect('Auto-selecting first item:', firstItem);
            handleRowClick(firstItem); // Use your existing handler
        }
    });
	$inspect(detailedContent)
</script>

{#snippet sidebar()}
<h1 class="mb-4 text-2xl font-bold text-gray-800">S3 Bucket Contents</h1>
<p class="mb-4 text-gray-600">
	Listing folders in bucket: <code class="rounded bg-gray-200 px-2 py-1 text-sm"
		>{data.bucket}</code
	>
</p>

<form method="POST"
      action="?/filter"
      class="card bg-secondary-100 space-y-4 p-4">
	<label class="label">
		<span>Prefix</span>
		<input name="prefix" class="input" type="string" value={prefix} required />
	</label>
	<div class="flex justify-start">
		<button type="submit" class="btn preset-filled-primary-500">
			<span>Filter by Prefix</span>
		</button>
	</div>


<div class="table-wrap">
	<table class="table table-fixed caption-bottom">
		<thead>
			<tr>
				<th>Campaign</th>
			</tr>
		</thead>
		<tbody class="[&>tr]:hover:preset-tonal-primary">
			{#each slicedSource(sourceData) as row, i}
				<tr
				onclick={() => handleRowClick(row)}
				class="cursor-pointer"
				class:bg-primary-100={activeSidebarItem?.campaign === row.campaign}
				class:font-semibold={activeSidebarItem?.campaign === row.campaign}
				class:text-primary-700={activeSidebarItem?.campaign === row.campaign}
				>
					<td class:bg-primary-50={row.campaign === activeSidebarItem?.campaign}>
						{row.campaign}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
<footer class="">
	<select
		name="size"
		id="size"
		class="select max-w-[150px]"
		value={size}
		onchange={(e) => (size = Number(e.currentTarget.value))}
	>
		{#each [1, 2, 5] as v}
			<option value={v}>Items {v}</option>
		{/each}
		<option value={sourceData.length}>Show All</option>
	</select>
	<Pagination
		data={sourceData}
		{page}
		onPageChange={(e) => (page = e.page)}
		pageSize={size}
		onPageSizeChange={(e) => (size = e.pageSize)}
		siblingCount={4}
	>
		{#snippet labelEllipsis()}<IconEllipsis class="size-4" />{/snippet}
		{#snippet labelNext()}<IconArrowRight class="size-4" />{/snippet}
		{#snippet labelPrevious()}<IconArrowLeft class="size-4" />{/snippet}
		{#snippet labelFirst()}<IconFirst class="size-4" />{/snippet}
		{#snippet labelLast()}<IconLast class="size-4" />{/snippet}
	</Pagination>
</footer>
</form>
{/snippet}

{#snippet main()}
<Campaign
	isLoading={isLoadingDetails}
	error={detailError}
	campaignFiles={detailedContent?.files}
	activeCampaign={activeSidebarItem?.campaign}
/>
{/snippet}

<ContentLayout {sidebar} {main} />
