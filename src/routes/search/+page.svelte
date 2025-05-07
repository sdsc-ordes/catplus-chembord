<script lang="ts">
	let { data, form } = $props();
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import Atom from '@lucide/svelte/icons/atom';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import TestTubes from '@lucide/svelte/icons/test-tubes';
	import Search from '@lucide/svelte/icons/search';
	import Archive from '@lucide/svelte/icons/archive';
	import IconLink from '@lucide/svelte/icons/link';
	import { s3LinkToUrlPath } from '$lib/utils/s3LinkParser'
	import { Pagination } from '@skeletonlabs/skeleton-svelte'
    import { mapSparqlResultsToTableBody } from '$lib/utils/mapSparqlResults';

	type FilterCategory =
		| 'chemicalName'
		| 'campaignName'
		| 'smiles'
		| 'cas'
		| 'reactionType'
		| 'reactionName';

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

	interface SelectionState {
		selected: Set<string>;
		display: string;
		active: boolean;
	}

	function initializeCategoryState(categoryKey: FilterCategory): SelectionState {
		const initialValues = data.initialFilters?.[categoryKey] ?? [];
		const initialSet = new Set(initialValues);
		const initialDisplay = initialValues.length > 0 ? initialValues.join(', ') : '';
		const initialActive = initialSet.size > 0;
		return { selected: initialSet, display: initialDisplay, active: initialActive };
	}

	function toggleGenericSelection<T extends FilterCategory>(
		selectionsState: Record<T, SelectionState>,
		category: T,
		value: string,
		isChecked: boolean
	): void {
		const currentCategoryState = selectionsState[category];
		if (!currentCategoryState) {
			console.warn(`Category "${category}" not found in selections state.`);
			return;
		}
		const updatedSet = new Set(currentCategoryState.selected);
		if (isChecked) {
			updatedSet.add(value);
		} else {
			updatedSet.delete(value);
		}
		selectionsState[category].selected = updatedSet;
		const selectedArray = [...updatedSet];
		selectionsState[category].display = selectedArray.length > 0 ? selectedArray.join(',') : '';
		selectionsState[category].active = updatedSet.size > 0;
	}

	let selections = $state<Record<FilterCategory, SelectionState>>({
		chemicalName: initializeCategoryState('chemicalName'),
		campaignName: initializeCategoryState('campaignName'),
		smiles: initializeCategoryState('smiles'),
		cas: initializeCategoryState('cas'),
		reactionType: initializeCategoryState('reactionType'),
		reactionName: initializeCategoryState('reactionName')
	});

	let value = $state<string[]>([]);

	const displayResults = $derived(form?.results ?? data.results ?? []);
	let page = $state(1);
	let size = $state(5);
	const slicedResults = $derived(
		displayResults.slice((page - 1) * size, page * size)
	);

	const tableHead = ['S3 Link', 'Campaign', 'Chemical', 'SMILES', 'CAS', 'Reaction', 'Type'];
	const tableKeysInOrder = ['s3link', 'campaignName', 'chemicalName', 'smiles', 'cas', 'reactionName', 'reactionType'];
	const tableSource = $derived({
		head: tableHead,
		body: mapSparqlResultsToTableBody(slicedResults, tableKeysInOrder),
	});
	$inspect("tableSource", tableSource);
	$inspect("silcedresuts", slicedResults);
</script>

<div class="grid grid-cols-1 md:grid-cols-[auto_1fr]">
	<aside class="p-4">
		<form method="POST" action="?/search" class="mx-auto w-full max-w-md space-y-4">
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
			<div class="flex justify-start">
				<button type="submit" class="btn preset-filled-primary-500">
					<span>Search</span>
				</button>
			</div>
		</form>
	</aside>
    <main class="space-y-4 p-4">
	<h1 class="mb-6 text-2xl font-bold text-gray-800">Results ({displayResults.length})</h1>
	<section class="space-y-4">
		<!-- Table -->
		<div class="table-wrap">
		  <table class="table table-fixed caption-bottom">
			<thead>
			  <tr>
				{#each tableHead as header}
				<th>{header}</th>
				{/each}
			  </tr>
			</thead>
			<tbody class="[&>tr]:hover:preset-tonal-primary">
			  {#each tableSource.body as row, rowIndex (rowIndex)}
				<tr>
					{#each row as cell, index}
					<td>
					{#if index === 0}
						<a href={s3LinkToUrlPath(cell)}>campaign-link</a>
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
		<!-- Footer -->
		<footer class="flex justify-between">
		  <select name="size" id="size" class="select max-w-[150px]" value={size} onchange={(e) => (size = Number(e.currentTarget.value))}>
			{#each [1, 2, 5] as v}
			  <option value={v}>Items {v}</option>
			{/each}
			<option value={slicedResults.length}>Show All</option>
		  </select>
		  <!-- Pagination -->
		  <Pagination
			data={tableSource}
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
	</main>
</div>
