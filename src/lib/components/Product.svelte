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
        campaignFiles = [],
        activeCampaign = null,
        activeProduct = null,
        activePeaks = [],
        title = "",
    }: {
        isLoading?: boolean;
        error?: string | null;
        campaignFiles?: S3FileInfoWithUrl[] | [];
        activeCampaign?: string | null;
        activeProduct?: string | null;
        activePeaks?: string[] | null;
        title: string | "";
    } = $props();
    $inspect({
        isLoading,
        error,
        campaignFiles,
        activeCampaign,
        activeProduct,
        activePeaks,
        title
    });

    interface FileTableColumns {
        title: string; // Column title
        widthInPercent: number // Column width in percent
    }

    const FileTableHeaders: FileTableColumns[] = [
        {title: "File name", widthInPercent: 45},
        {title: "Size", widthInPercent: 20},
        {title: "Last modified", widthInPercent: 25},
        {title: "Download", widthInPercent: 10},
    ]

    let filteredFiles = $derived(() => {
        console.log(activeProduct, activePeaks);
        // If there are no files to filter, return an empty array
        if (!campaignFiles || campaignFiles.length === 0) {
            return [];
        }

        const otherFileTypes = ['-Bravo-', '-IR-', '-MNR-', '-UV-'];
        console.log("Filtering files with activeProduct:", activeProduct, "and activePeaks:", activePeaks);

        return campaignFiles.filter(file => {
            const fileName = file.name;

            // Condition 1: Handle '-Agilent-' files
            if (fileName.includes('-Agilent-')) {
                // Keep the file ONLY if activeProduct is defined and is a prefix of the file name
                return activeProduct && fileName.startsWith(activeProduct);
            }

            // Condition 2: Handle other special file types
            if (otherFileTypes.some(type => fileName.includes(type))) {
                // Keep the file ONLY if activePeaks has items and one of them is a prefix
                return Array.isArray(activePeaks) && activePeaks.length > 0 && activePeaks.some(peak => fileName.startsWith(peak));
            }

            // Condition 3: If it's not a special file type, always display it
            return true;
        });
    });

    $inspect("filtered files", { filteredFiles });
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
{:else if campaignFiles && activeCampaign}
    <div class="hover:bg-tertiary-100-900">
    <h1 class="mb-6 flex items-center gap-x-2 text-2xl text-surface-800-200">
        <Archive />
        <span>{title}</span>
        <span>{activeCampaign}</span>
        <span>{activeProduct}</span>
        <ul>
            {#each activePeaks as peak}
            <li>{peak}</li>
            {/each}
        </ul>
		<a
			href={`${base}/api/${activeCampaign}download`}
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
