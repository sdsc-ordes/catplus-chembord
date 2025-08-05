<script lang="ts">
    import Archive from '@lucide/svelte/icons/archive';
    import FolderDown from '@lucide/svelte/icons/folder-down';
    import { formatBytes} from '$lib/utils/displayFile';
    import { type S3FileInfoWithUrl } from '$lib/server/s3';
    import { getZipFileName } from '$lib/utils/zipFileName';
    import { base } from '$app/paths';
    let {
        isLoading = false,
        error = null,
        filteredFiles = [],
        activeCampaign = null,
        activeProduct = null,
        activePeaks = [],
        title = "",
    }: {
        isLoading?: boolean;
        error?: string | null;
        filteredFiles?: S3FileInfoWithUrl[] | [];
        activeCampaign?: string | null;
        activeProduct?: string | null;
        activePeaks?: string[] | [];
        title: string | "";
    } = $props();

    interface FileTableColumns {
        title: string; // Column title
        widthInPercent: number // Column width in percent
    }

    const FileTableHeaders: FileTableColumns[] = [
        {title: "File name", widthInPercent: 45},
        {title: "Size", widthInPercent: 20},
        {title: "Last modified", widthInPercent: 25},
        {title: "Download", widthInPercent: 10},
    ];
    const downloadUrl = $derived(`${base}/api/${activeCampaign}/download?product=${activeProduct}`);
</script>

{#if isLoading}
    <div class="p-6 text-center text-surface-500 animate-pulse">
        <p>Loading details...</p>
        </div>
{:else if error}
    <div class="p-6 card bg-error-100 text-error-700 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-2">Error Fetching Details</h2>
        <p>{error}</p>
    </div>
{:else if filteredFiles && activeCampaign}
    <div class="hover:bg-tertiary-100-900">
    <h1 class="mb-6 flex items-center gap-x-2 text-2xl text-surface-800-200">
        <Archive />
        <span>{activeCampaign}</span>
        <span>{activeProduct}</span>
		<a
			href={`${base}/api/${activeCampaign}download?product=${activeProduct}&peaks=${activePeaks.join(',')}`}
			class="btn btn-sm variant-outline-secondary hover:text-primary-500"
			title="Download all files in this folder as ZIP"
			download={getZipFileName(activeCampaign, activeProduct)}
			target="_blank"
			rel="noopener noreferrer"
		>
			<FolderDown />
			<span>Download ZIP {getZipFileName(activeCampaign, activeProduct)}</span>
		</a>
    </h1>
    </div>
    <div class="table-wrap">
        <table class="table table-fixed caption-bottom">
            <thead>
                <tr>
                    {#each FileTableHeaders as header}
                        <th class="w-[{header.widthInPercent}%] text-left p-3">
                            {header.title}
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody class="[&>tr]:hover:bg-tertiary-100-900">
                {#each filteredFiles as file}
                    <tr>
                        <td>{file.name}</td>
                        <td>{formatBytes(file.Size)}</td>
                        <td>{file.LastModified}</td>
                        <td>
                            {#if file.presignedUrl}
                                <a href={file.presignedUrl} title="Download this file" class="hover:text-primary-500">
                                    <FolderDown size={24} />
                                </a>
                            {/if}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{:else if activeCampaign}
    <div class="p-6 text-center text-surface-500">
        <p>Preparing details for {activeCampaign}...</p>
    </div>
{/if}
