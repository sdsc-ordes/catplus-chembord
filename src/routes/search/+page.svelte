<script lang="ts">
	let { data, form } = $props();
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import Atom from '@lucide/svelte/icons/atom';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import TestTubes from '@lucide/svelte/icons/test-tubes';
	import Search from '@lucide/svelte/icons/search';
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
	const tableBody = $derived(mapSparqlResultsToTableBody(displayResults, tableKeysInOrder));
	$inspect(tableBody);
	const tableSource = $derived({
		head: ['S3 Link', 'Campaign', 'Chemical', 'SMILES', 'CAS', 'Reaction', 'Type'],
		body: tableBody
	});
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
	<div class="p-4">
		{#if displayResults.length > 0}
			<div class="grid grid-cols-7 gap-x-4 gap-y-2 text-sm">
				{#each tableHead as header}
					<div
						class="text-surface-600 dark:text-surface-300 border-surface-300 dark:border-surface-700 border-b pb-1 font-semibold"
					>
						{header}
					</div>
				{/each}
				{#each tableBody as row, rowIndex (rowIndex)}
					{#each row as cell, cellIndex (cellIndex)}
						<div
							class="text-surface-700 dark:text-surface-200 {cellIndex === 0 || cellIndex === 3
								? 'truncate font-mono'
								: ''}"
							title={cell}
						>
							{cell || '-'}
						</div>
					{/each}
				{/each}
			</div>
		{:else}
			<p class="text-surface-500 p-4 text-center">No results found for the current filters.</p>
		{/if}
    </div>
	</main>
</div>
