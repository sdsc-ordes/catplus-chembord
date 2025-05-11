<script lang="ts">
	import ContentLayout from '$lib/components/ContentLayout.svelte';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconArrowLeft from '@lucide/svelte/icons/arrow-left';
	import IconArrowRight from '@lucide/svelte/icons/arrow-right';
	import IconEllipsis from '@lucide/svelte/icons/ellipsis';
	import IconFirst from '@lucide/svelte/icons/chevrons-left';
	import IconLast from '@lucide/svelte/icons/chevron-right';

	interface TableData {
		position: number;
		name: string;
	}

	let data = $props<{ tableData: TableData[] }>();
    $inspect(data);
    let tableData = $state(data.data.tableData || []);
    $inspect('tableData $state after init:', tableData);

	// State
	let page = $state(1);
	let size = $state(5);

	const slicedSource = $derived((s: TableData[]) => s.slice((page - 1) * size, page * size));
    $inspect('slicedItems derived:', slicedSource);

</script>

{#snippet sidebar()}
	<section class="space-y-4">
		<!-- Table -->
		<div class="table-wrap">
			<table class="table table-fixed caption-bottom">
				<thead>
					<tr>
						<th>Position</th>
						<th>Name</th>
					</tr>
				</thead>
				<tbody class="[&>tr]:hover:preset-tonal-primary">
					{#each slicedSource(tableData) as row}
						<tr>
							<td>{row.position}</td>
							<td>{row.name}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<!-- Footer -->
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
				<option value={tableData.length}>Show All</option>
			</select>
			<!-- Pagination -->
			<Pagination
				data={tableData}
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
{/snippet}

{#snippet main()}
	<p>Main Content</p>
{/snippet}

<ContentLayout {sidebar} {main} />
