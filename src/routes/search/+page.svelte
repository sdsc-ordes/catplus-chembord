<script lang="ts">
	let { data, form } = $props();
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import ContentLayout from '$lib/components/ContentLayout.svelte';
	import Atom from '@lucide/svelte/icons/atom';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import TestTubes from '@lucide/svelte/icons/test-tubes';
	import Search from '@lucide/svelte/icons/search';
	import IconArrowLeft from '@lucide/svelte/icons/arrow-left';
	import IconArrowRight from '@lucide/svelte/icons/arrow-right';
	import IconEllipsis from '@lucide/svelte/icons/ellipsis';
	import IconFirst from '@lucide/svelte/icons/chevrons-left';
	import IconLast from '@lucide/svelte/icons/chevron-right';
	import { s3LinkToUrlPath } from '$lib/utils/s3LinkParser';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	import { mapSparqlResultsToTableBody } from '$lib/utils/mapSparqlResults';
	import type { SelectionState, FilterCategory } from './types.d';
	import { FilterCategoryConstants } from './types.d';
	import { initializeCategoryState, toggleGenericSelection } from '$lib/utils/searchForm';

	// Search form
	const accordionItemsConfig: {
		value: FilterCategory;
		label: string;
		icon: typeof Atom;
		list: string[];
		nameAttr: string;
	}[] = $derived([
		{
			value: 'campaignName',
			label: 'Campaign Name',
			icon: TestTubes,
			list: data.picklists?.campaignName ?? [],
			nameAttr: 'selected_campaign_names'
		},
		{
			value: 'reactionType',
			label: 'Reaction Type',
			icon: FlaskConical,
			list: data.picklists?.reactionType ?? [],
			nameAttr: 'selected_reaction_types'
		},
		{
			value: 'reactionName',
			label: 'Reaction Name',
			icon: FlaskConical,
			list: data.picklists?.reactionName ?? [],
			nameAttr: 'selected_reaction_names'
		},
		{
			value: 'chemicalName',
			label: 'Chemical Name',
			icon: Atom,
			list: data.picklists?.chemicalName ?? [],
			nameAttr: 'selected_chemicals'
		},
		{
			value: 'cas',
			label: 'CAS Number',
			icon: Atom,
			list: data.picklists?.cas ?? [],
			nameAttr: 'selected_cas'
		},
		{
			value: 'smiles',
			label: 'SMILES',
			icon: Atom,
			list: data.picklists?.smiles ?? [],
			nameAttr: 'selected_smiles'
		}
	]);

	const allCategories = Object.values(FilterCategoryConstants);
	const initialSelectionsObject = Object.fromEntries(
		allCategories.map((categoryKey) => {
			const categorySpecificInitialData = data.initialFilters?.[categoryKey] ?? [];
			return [categoryKey, initializeCategoryState(categoryKey, categorySpecificInitialData)];
		})
	) as Record<FilterCategory, SelectionState>;
	let selections = $state<Record<FilterCategory, SelectionState>>(initialSelectionsObject);

	let value = $state<string[]>([]);

	// Result table
	const displayResults = $derived(form?.results ?? data.results ?? []);
	let page = $state(1);
	let size = $state(5);

	const tableHead = ['S3 Link', 'Campaign', 'Chemical', 'SMILES', 'CAS', 'Reaction', 'Type'];
	const tableKeysInOrder = [
		's3link',
		'campaignName',
		'chemicalName',
		'smiles',
		'cas',
		'reactionName',
		'reactionType'
	];
	const sourceData = $derived(mapSparqlResultsToTableBody(displayResults, tableKeysInOrder));
	const slicedSourceData = $derived(sourceData.slice((page - 1) * size, page * size));
	$inspect('sourceData', sourceData);
	$inspect('slicedSourceData', slicedSourceData);
	$inspect(data);
</script>

{#snippet sidebar()}
<form
	method="POST"
	action="?/search"
	class="bg-secondary-100 mx-auto w-full max-w-md space-y-4 rounded"
>
	<div class="flex justify-start">
		<button type="submit" class="btn preset-filled-primary-500 w-full">
			<Search />Search
		</button>
	</div>
	<Accordion {value} onValueChange={(e) => (value = e.value)} multiple>
		{#each accordionItemsConfig as item}
			<Accordion.Item
				value={item.value}
				controlClasses={selections[item.value].active ? 'bg-primary-50' : ''}
			>
				<!-- Control -->
				{#snippet lead()}<item.icon size={24} /><input
						class="hidden"
						name={item.nameAttr}
						value={selections[item.value].display}
					/>{/snippet}
				{#snippet control()}{item.label}: {selections[item.value].display}{/snippet}
				<!-- Panel -->
				{#snippet panel()}
					{#each item.list as optionValue (optionValue)}
						<label class="flex cursor-pointer items-center space-x-2">
							<input
								class="checkbox"
								type="checkbox"
								value={optionValue}
								checked={selections[item.value].selected.has(optionValue)}
								onchange={(e) =>
									toggleGenericSelection(
										selections,
										item.value,
										optionValue,
										e.currentTarget.checked
									)}
							/>
							<p>{optionValue}</p>
						</label>
					{/each}
				{/snippet}
			</Accordion.Item>
		{/each}
	</Accordion>
</form>
{/snippet}

{#snippet main()}
<div class="table-wrap">
	<table class="table-wrap table caption-bottom">
		<thead>
			<tr>
				{#each tableHead as header}
					<th>{header}</th>
				{/each}
			</tr>
		</thead>
		<tbody class="[&>tr]:hover:preset-tonal-primary">
			{#each slicedSourceData as row, rowIndex (rowIndex)}
				<tr>
					{#each row as cell, index}
						<td>
							{#if index === 0}
								<a href={s3LinkToUrlPath(cell)} class="text-primary-500"
									>batch/2024/05/03/28/</a
								>
							{:else}
								{cell}
							{/if}
						</td>
					{/each}
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
			<option value={v}>Results {v}</option>
		{/each}
		<option value={sourceData.length}>Show All</option>
	</select>
	<!-- Pagination -->
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
{/snippet}

<ContentLayout {sidebar} {main} />
