<script lang="ts">
	// The 'data' prop is automatically populated by SvelteKit
	// with the return value from the load function in +page.server.ts
	let { data } = $props();
	import { page } from '$app/state';
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import Archive from '@lucide/svelte/icons/archive';
	import FileText from '@lucide/svelte/icons/file-text';
	import  { s3PrefixToUrlPath } from '$lib/utils/prefixParser'

	import { groupFilesByCalculatedPrefix } from '$lib/utils/groupFiles';
	//console.log('data', data);
	let prefix = page.url.searchParams.get('prefix') || 'batch/';

	let value = $state(['archive']);
	let foldersWithFiles = groupFilesByCalculatedPrefix(data.files);
</script>

<div class="container mx-auto p-4 font-sans md:p-8">
	<h1 class="mb-6 text-2xl font-bold text-gray-800">S3 Bucket Contents</h1>
	<p class="mb-4 text-gray-600">
		Listing folders in bucket: <code class="rounded bg-gray-200 px-2 py-1 text-sm"
			>{data.bucket}</code
		>
	</p>

	<form method="POST" action="?/filter" class="space-y-4 card p-4 bg-surface-50">
		<label class="label">
			<span>Prefix</span>
			<input
				name="prefix"
				class="input"
				type="string"
				value={prefix}
				required
			/>
		</label>
		<div class="flex justify-start">
			<button type="submit" class="btn preset-filled-primary-500">
				<span>Filter by Prefix</span>
			</button>
		</div>
	</form>

	  <Accordion {value} onValueChange={(e) => (value = e.value)} multiple>
		{#each foldersWithFiles as folder}
		  <Accordion.Item value={folder.prefix}>
			<!-- Control -->
			{#snippet lead()}<Archive size={24} />{/snippet}
			{#snippet control()}{folder.prefix}
			{/snippet}
			<!-- Panel -->
			{#snippet panel()}
				{#each folder.files as file}
				<div class="flex items-center space-x-2 py-1">
					<FileText size={16} class="text-surface-500 flex-shrink-0" />
					<span>
						<a href={s3PrefixToUrlPath(file.Key)}>{file.name} ({file.Size} bytes)</a>
					</span>
				  </div>
				{/each}
			{/snippet}
		  </Accordion.Item>
		{/each}
	  </Accordion>

</div>

