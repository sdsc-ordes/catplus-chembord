<script lang="ts">
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import Atom from '@lucide/svelte/icons/atom';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import TestTubes from '@lucide/svelte/icons/test-tubes';
	import Search from '@lucide/svelte/icons/search';
	import type { FilterCategory } from './types.d';
	import { FilterCategoryConstants } from '$lib/const/search';
	import { initializeCategoryState, toggleGenericSelection, type SelectionState } from '$lib/utils/searchForm';
	let { data } = $props();

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
</script>

<form
	method="POST"
	action="?/search"
	class="bg-secondary-100 mx-auto w-full max-w-md space-y-4 rounded"
>
	<Accordion {value} onValueChange={(e) => (value = e.value)} multiple>
		{#each accordionItemsConfig as item}
			<Accordion.Item
				value={item.value}
				classes="text-sm"
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
							<p class="break-words">{optionValue}</p>
						</label>
					{/each}
				{/snippet}
			</Accordion.Item>
		{/each}
	</Accordion>
	<div class="flex justify-start">
		<button type="submit" class="btn preset-filled-primary-500 w-full">
			<Search />Apply Search Filter
		</button>
	</div>
</form>
