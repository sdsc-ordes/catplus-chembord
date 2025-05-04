<script lang="ts">
	// The 'data' prop is automatically populated by SvelteKit
	// with the return value from the load function in +page.server.ts
	let { data } = $props();
	import Archive from '@lucide/svelte/icons/archive';
    import FileText from '@lucide/svelte/icons/file-text';
	import FolderDown from '@lucide/svelte/icons/folder-down';
	const files = data.files;
    const prefix = data.prefix;
	console.log('data', data);
	import { formatBytes, formatDate} from '$lib/utils/displayFile';
	import { getZipFileName } from '$lib/utils/zipFileName';
</script>

<div class="container mx-auto p-4 font-sans md:p-8">
	<h1 class="mb-6 text-2xl font-bold text-gray-800">Cat+ Campaign</h1>
	<p class="mb-4 text-surface-600 dark:text-surface-300">
		Listing folders in bucket: <code class="chip variant-soft">{data.bucket || 'N/A'}</code>
	</p>

	<div class="card variant-ghost-surface p-6 shadow-sm">
		<div class="mb-4 flex items-center justify-between gap-4 border-b border-surface-300 dark:border-surface-700 pb-2">
			<div class="flex items-center gap-2 min-w-0">
				<Archive size={20} class="text-primary-500 flex-shrink-0" />
				<span class="text-lg font-semibold text-surface-700 dark:text-surface-200 truncate" title={prefix}>
					{prefix || 'Bucket Root'}
				</span>
			</div>

			{#if files.length > 0}
				<a
					href={`/api/s3-zip?prefix=${encodeURIComponent(prefix)}`}
					class="btn btn-sm variant-outline-secondary"
					title="Download all files in this folder as ZIP"
					download={getZipFileName(prefix)}
					target="_blank"
					rel="noopener noreferrer"
				>
					<FolderDown size={24} />
					<span>Download ZIP {getZipFileName(prefix)}</span>
				</a>
			{/if}
		</div>

		<div class="space-y-1">
			{#if files.length > 0}
				{#each files as file (file.Key)}
					<div class="flex items-center justify-between space-x-2 rounded px-2 py-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150">
						<div class="flex items-center space-x-2 min-w-0">
							<FileText size={16} class="text-surface-500 flex-shrink-0" />
							<span class="truncate text-sm font-mono text-surface-700 dark:text-surface-300" title={file.name}>
								{file.name}
							</span>
						</div>
						<div class="flex space-x-4 text-surface-500 dark:text-surface-400 text-xs whitespace-nowrap flex-shrink-0 pl-2">
							<span>{formatBytes(file.Size)}</span>
							<span>{formatDate(file.LastModified)}</span>
							{#if file.presignedUrl}
								<a href={file.presignedUrl} title="Download this file" class="hover:text-primary-500">
									<FolderDown size={24}/>
								</a>
							{/if}
						</div>
					</div>
				{/each}
			{:else}
				<p class="text-sm text-surface-500 dark:text-surface-400 italic px-2 py-1">No files found in this prefix.</p>
			{/if}
		</div>
	</div>
</div>

