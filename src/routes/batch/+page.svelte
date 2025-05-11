<script lang="ts">
	let { data } = $props();
	import { page as routePage } from '$app/state';
	import ContentLayout from '$lib/components/ContentLayout.svelte';
	import IconArrowLeft from '@lucide/svelte/icons/arrow-left';
	import IconArrowRight from '@lucide/svelte/icons/arrow-right';
	import IconEllipsis from '@lucide/svelte/icons/ellipsis';
	import IconFirst from '@lucide/svelte/icons/chevrons-left';
	import IconLast from '@lucide/svelte/icons/chevron-right';
	import FolderDown from '@lucide/svelte/icons/folder-down';
	import { groupFilesByCalculatedPrefix } from './groupFiles';
	import { type FolderGroup, FileTableHeaders } from './types.d';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	import { formatBytes, formatDate} from '$lib/utils/displayFile';
	import { getZipFileName } from '$lib/utils/zipFileName';
	import { s3LinkToUrlPath } from '$lib/utils/s3LinkParser';
	import { Archive } from '@lucide/svelte';

	let prefix = routePage.url.searchParams.get('prefix') || 'batch/';
	let activeFolder = data.activeFolder;
	interface SourceData {
		campaign: string;
	}
	let sourceData: SourceData[] = data.foldersWithFiles.map(folderElement => {
		return { campaign: folderElement.prefix };
	});

	// State
	let page = $state(1);
	let size = $state(5);
	const slicedSource = $derived((s: SourceData[]) => s.slice((page - 1) * size, page * size));

	const activeFolderFiles = data.activefilesWithDownloadUrls;
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
				<tr>
					<td class:bg-primary-50={row.campaign === activeFolder}>
						{row.campaign}{i}
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
<h1 class="mb-6 flex items-center gap-x-2 text-2xl font-bold text-gray-800">
    <Archive />
    <span>{activeFolder}</span>
</h1>
<div class="table-wrap">
    <table class="table table-fixed caption-bottom">
      <thead>
        <tr>
		  {#each FileTableHeaders as header}
          <th>{header}</th>
          {/each}
        </tr>
      </thead>
      <tbody class="[&>tr]:hover:preset-tonal-primary">
        {#each activeFolderFiles as file}
          <tr>
			<td>{file.name}</td>
            <td>{formatBytes(file.Size)}</td>
            <td>{formatDate(file.LastModified)}</td>
            <td>
				{#if file.presignedUrl}
					<a href={file.presignedUrl} title="Download this file" class="hover:text-primary-500">
						<FolderDown size={24}/>
					</a>
				{/if}
			</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/snippet}

<ContentLayout {sidebar} {main} />
