<script lang="ts">
	// The 'data' prop is automatically populated by SvelteKit
	// with the return value from the load function in +page.server.ts
	let { data } = $props();
	import { page as routePage } from '$app/state';
	import { s3PrefixToUrlPath } from '$lib/utils/prefixParser';
	import IconArrowLeft from '@lucide/svelte/icons/arrow-left';
	import IconArrowRight from '@lucide/svelte/icons/arrow-right';
	import IconEllipsis from '@lucide/svelte/icons/ellipsis';
	import IconFirst from '@lucide/svelte/icons/chevrons-left';
	import IconLast from '@lucide/svelte/icons/chevron-right';
	import { groupFilesByCalculatedPrefix } from '$lib/utils/groupFiles';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';

	let prefix = routePage.url.searchParams.get('prefix') || 'batch/';
	let foldersWithFiles = groupFilesByCalculatedPrefix(data.files);

	$inspect(foldersWithFiles);

	interface SourceData {
		campaign: string;
	}
	let sourceData: SourceData[] = foldersWithFiles.map(folderElement => {
		return { campaign: folderElement.prefix };
	});
	$inspect(sourceData)

	// State
	let page = $state(1);
	let size = $state(5);
	const slicedSource = $derived((s: SourceData[]) => s.slice((page - 1) * size, page * size));
</script>
<div class="grid grid-cols-1 md:grid-cols-[auto_1fr]">
	<aside class="p-4">
		<div class="container mx-auto p-4 font-sans md:p-8">
			<h1 class="mb-6 text-2xl font-bold text-gray-800">S3 Bucket Contents</h1>
			<p class="mb-4 text-gray-600">
				Listing folders in bucket: <code class="rounded bg-gray-200 px-2 py-1 text-sm"
					>{data.bucket}</code
				>
			</p>

			<form method="POST" action="?/filter" class="card bg-surface-50 space-y-4 p-4">
				<label class="label">
					<span>Prefix</span>
					<input name="prefix" class="input" type="string" value={prefix} required />
				</label>
				<div class="flex justify-start">
					<button type="submit" class="btn preset-filled-primary-500">
						<span>Filter by Prefix</span>
					</button>
				</div>
			</form>
			<section class="space-y-4">
				<div class="table-wrap">
					<table class="table table-fixed caption-bottom">
						<thead>
							<tr>
								<th>Campaign</th>
							</tr>
						</thead>
						<tbody class="[&>tr]:hover:preset-tonal-primary">
							{#each slicedSource(sourceData) as row}
								<tr>
									<td>{row.campaign}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<footer class="flex justify-between">
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
			</section>
		</div>
	</aside>
	<main class="space-y-4 p-4">
		<h1 class="mb-6 text-2xl font-bold text-gray-800">Display folders</h1>
		<section class="space-y-4">
		</section>
	</main>
</div>
