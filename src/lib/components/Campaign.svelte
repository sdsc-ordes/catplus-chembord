<script>
    import Archive from '@lucide/svelte/icons/archive';
    import FolderDown from '@lucide/svelte/icons/folder-down';
    import { formatBytes, formatDate} from '$lib/utils/displayFile';
    import { FileTableHeaders } from '$lib/schema/campaign'
    import { getZipFileName } from '$lib/utils/zipFileName';

    export let activeSidebarItem = null;
    export let detailedContent = null;
</script>

{#if activeSidebarItem}
    <h1 class="mb-6 flex items-center gap-x-2 text-2xl font-bold text-gray-800">
        <Archive />
        <span>{activeSidebarItem?.campaign}</span>
    </h1>
    {#if detailedContent}
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
                <tbody class="[&>tr]:hover:preset-tonal-primary">
                    {#each detailedContent.files as file}
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
    {/if}
{/if}