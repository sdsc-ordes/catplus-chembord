<script lang="ts">
	// The 'data' prop is automatically populated by SvelteKit
	// with the return value from the load function in +page.server.ts
	let { data } = $props();
	import ContentLayout from '$lib/components/ContentLayout.svelte';
	import Archive from '@lucide/svelte/icons/archive';
    import FileText from '@lucide/svelte/icons/file-text';
	import FolderDown from '@lucide/svelte/icons/folder-down';
	const files = data.files;
    const prefix = data.prefix;
	//console.log('data', data);
	import { type FolderGroup, FileTableHeaders } from './types.d';
	import { formatBytes, formatDate} from '$lib/utils/displayFile';
	import { getZipFileName } from '$lib/utils/zipFileName';
    $inspect($state)
	$inspect(files);
</script>

{#snippet sidebar()}
<h1 class="mb-4 text-2xl font-bold text-gray-800">S3 Bucket Contents</h1>
<p class="mb-4 text-gray-600">
	Listing folders in bucket: <code class="rounded bg-gray-200 px-2 py-1 text-sm"
		>{data.bucket}</code
	>
</p>
{/snippet}

{#snippet main()}
<h1 class="mb-6 flex items-center gap-x-2 text-2xl font-bold text-gray-800">
    <Archive />
    <span>{prefix}</span>
	{#if files.length > 0}
		<a
			href={`/api/s3-zip?prefix=${encodeURIComponent(prefix)}`}
			class="btn btn-sm variant-outline-secondary"
			title="Download all files in this folder as ZIP"
			download={getZipFileName(prefix)}
			target="_blank"
			rel="noopener noreferrer"
		>
			<FolderDown />
			<span>Download ZIP {getZipFileName(prefix)}</span>
		</a>
	{/if}
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
        {#each files as file}
          <tr>
			<td>{file.name}</td>
            <td>{formatBytes(file.Size)}</td>
            <td>{file.LastModified}</td>
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