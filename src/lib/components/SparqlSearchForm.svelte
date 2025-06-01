<script lang="ts">
	import { Accordion } from '@skeletonlabs/skeleton-svelte';;
	import {
		type FilterCategory, FilterCategoriesSorted
	} from '$lib/config';
	import { Search, Atom } from '@lucide/svelte';
	import {
		initializeCategoryState, toggleGenericSelection, type SelectionState
	} from '$lib/utils/searchFormSelectUtils';

	interface Props {
		picklists: Record<FilterCategory, string[]>;
		initialFilters: Record<FilterCategory, string[]>;
	};
	let { picklists, initialFilters }: Props = $props();

	// type used in the configuration of search filters
	interface FilterDisplayConfig {
		label: string,
		nameAttr: string;
	}

    // mapping of filter categories to lables and form attribute names
	export const FilterDisplays: Record<FilterCategory, FilterDisplayConfig> = {
		CAMPAIGN_NAME: {
			label: 'Campaign Name',
			nameAttr: 'campaign_name'
		},
		REACTION_NAME: {
			label: 'Reaction Name',
			nameAttr: 'reaction_name'
		},
		REACTION_TYPE: {
			label: 'Reaction Type',
			nameAttr: 'reaction_type'
		},
		CHEMICAL_NAME: {
			label: 'Chemical Name',
			nameAttr: 'chemical_name'
		},
		CAS: {
			label: 'Cas',
			nameAttr: 'cas'
		},
		SMILES: {
			label: 'Smiles',
			nameAttr: 'smiles'
		}
	}

	// type of the accordion search form
	interface AccordionItemConfig extends FilterDisplayConfig {
		options: string[];
	}

	// merge accordion with picklists that were retrieved from Qlever per FilterCategory
	const accordionItemsConfig = Object.fromEntries(
		FilterCategoriesSorted.map((categoryKey) => {
			const categorySpecificPicklist = picklists?.[categoryKey] ?? [];
			const itemConfig: AccordionItemConfig = {
				label: FilterDisplays[categoryKey].label,
				nameAttr: FilterDisplays[categoryKey].nameAttr,
				options: categorySpecificPicklist,
			};
			return [categoryKey, itemConfig];
		})
	) as Record<FilterCategory, AccordionItemConfig>;

	// set initial selections for each filter category
	const initialSelectionsObject = Object.fromEntries(
		FilterCategoriesSorted.map((categoryKey) => {
			const categorySpecificInitialData = initialFilters?.[categoryKey] ?? [];
			return [categoryKey, initializeCategoryState(categoryKey, categorySpecificInitialData)];
		})
	) as Record<FilterCategory, SelectionState>;

	// set the selection state in the form for each filter category
	let selections = $state<Record<FilterCategory, SelectionState>>(initialSelectionsObject);

	// initially accordion is closed
	let value = $state<string[]>([]);
</script>

<form
	method="POST"
	action="?/search"
	class="bg-secondary-100 mx-auto w-full max-w-md space-y-4 rounded"
>
	<Accordion {value} onValueChange={(e) => (value = e.value)} multiple>
		{#each FilterCategoriesSorted as key}
			<Accordion.Item
				value={key}
				classes="text-sm"
				controlClasses={selections[key].active ? 'bg-primary-50' : ''}
			>
			    <p>{accordionItemsConfig[key].options}</p>
				<!-- Control -->
			{#snippet lead()}
			<Atom size={24} /><input
						class="hidden"
						name={key}
						value={selections[key].display}
					/>
			{/snippet}
				{#snippet control()}{accordionItemsConfig[key].label}: {selections[key].display}{/snippet}
				<!-- Panel -->
				{#snippet panel()}
					{#each accordionItemsConfig[key].options as optionValue}
						<label class="flex cursor-pointer items-center space-x-2">
							<input
								class="checkbox"
								type="checkbox"
								value={optionValue}
								checked={selections[key].selected.has(optionValue)}
								onchange={(e) =>
									toggleGenericSelection(
										selections,
										key,
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
