<script lang="ts">
    import Archive from '@lucide/svelte/icons/archive';
    import FolderDown from '@lucide/svelte/icons/folder-down';
    import { formatBytes, formatDate} from '$lib/utils/displayFile';
    import { type S3FileInfoWithUrl } from '$lib/server/s3';
    import { FileTableHeaders } from '$lib/const/campaign';
    import { getZipFileName } from '$lib/utils/zipFileName';
    let {
        isLoading = false,
        error = null,
        campaignFiles = [],
        activeCampaign = null,
        title = "",
    }: {
        isLoading?: boolean;
        error?: string | null;
        campaignFiles?: S3FileInfoWithUrl[] | [];
        activeCampaign?: string | null;
        title: string | "";
    } = $props();
</script>

{#if isLoading}
    <div class="p-6 text-center text-gray-500 animate-pulse">
        <p>Loading details...</p>
        </div>
{:else if error}
    <div class="p-6 card bg-error-100 text-error-700 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-2">Error Fetching Details</h2>
        <p>{error}</p>
    </div>
{:else if campaignFiles && activeCampaign}
    <div class="hover:bg-tertiary-100">
    <h1 class="mb-6 flex items-center gap-x-2 text-2xl text-gray-800">
        <Archive />
        <span>{title}</span>
		<a
			href={`/api/s3-zip?prefix=${encodeURIComponent(title)}`}
			class="btn btn-sm variant-outline-secondary hover:text-primary-500"
			title="Download all files in this folder as ZIP"
			download={getZipFileName(activeCampaign)}
			target="_blank"
			rel="noopener noreferrer"
		>
			<FolderDown />
			<span>Download ZIP {getZipFileName(title)}</span>
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
            <tbody class="[&>tr]:hover:bg-tertiary-100">
                {#each campaignFiles as file}
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
    <div class="p-6 text-center text-gray-500">
        <p>Preparing details for {activeCampaign}...</p>
    </div>
{:else}
    <div class="flex items-center justify-center h-full text-gray-500">
        <p class="text-lg">Please select an item from the sidebar to view its details.</p>
    </div>
{/if}
