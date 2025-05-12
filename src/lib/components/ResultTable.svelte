
<div class="bg-tertiary-50 rounded">
<h1 class="mb-4 p-4 text-2xl font-bold text-gray-800">Results ({sourceData.length})</h1>
<div class="table-wrap bg-tertiary-50">
	<table class="table table-fixed caption-bottom">
		<thead>
			<tr>
				<th>Campaign Path</th>
				<th>Date</th>
			</tr>
		</thead>
		<tbody class="[&>tr]:hover:bg-tertiary-100">
			{#each slicedSource(sourceData) as row, i}
				<tr
				onclick={() => handleRowClick(row)}
				class="cursor-pointer"
				class:bg-tertiary-200={activeSidebarItem?.campaign === row.campaign}
				>
					<td>
						{row.campaign}
					</td>
					<td>
						{extractDateFromPath(row.campaign)}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
<footer class="">
	<Pagination
		data={sourceData}
		{page}
		onPageChange={handlePageChange}
		pageSize={size}
		siblingCount={4}
	>
		{#snippet labelEllipsis()}<IconEllipsis class="size-4" />{/snippet}
		{#snippet labelNext()}<IconArrowRight class="size-4" />{/snippet}
		{#snippet labelPrevious()}<IconArrowLeft class="size-4" />{/snippet}
		{#snippet labelFirst()}<IconFirst class="size-4" />{/snippet}
		{#snippet labelLast()}<IconLast class="size-4" />{/snippet}
	</Pagination>
</footer>
</div>
