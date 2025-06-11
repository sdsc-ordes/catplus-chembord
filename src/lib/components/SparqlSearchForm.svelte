<script lang="ts">
	import { selectedItems } from '$lib/shared.svelte';
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import SelectFilterCombox from '$lib/components/SelectFilterCombox.svelte';
	import {
		type FilterCategory, FilterCategoriesSorted
	} from '$lib/config';
	import { Search, Atom, X } from '@lucide/svelte';

	interface Props {
		picklists: Record<FilterCategory, string[]>;
		initialFilters: Record<FilterCategory, string[]>;
		transformedPicklists?: Record<FilterCategory, { label: string; value: string }[]>;
	};
	let { picklists, initialFilters, transformedPicklists }: Props = $props();

	// type used in the configuration of search filters
	interface FilterDisplayConfig {
		label: string,
		nameAttr: string;
	}

	FilterCategoriesSorted.forEach(categoryKey => {
		// Use the value from initialFilters if it exists for this categoryKey,
		// otherwise default to an empty array.
		selectedItems[categoryKey] = initialFilters[categoryKey] || [];
	});

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
		},
		DEVICES: {
		 	label: 'Devices',
		 	nameAttr: 'devices'
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

	// initially accordion is closed
	let accordionValue = $state<string[]>([]);

	/**
	 * Resets the selected items for all categories to an empty array.
	 */
	function handleReset() {
		for (const key of Object.keys(selectedItems)) {
			selectedItems[key] = [];
		}
    }
</script>

<form
	method="POST"
	action="?/search"
	class="bg-secondary-100 mx-auto w-full max-w-md space-y-4 rounded"
>
	<Accordion {accordionValue} onValueChange={(e) => (accordionValue = e.value)} multiple>
		{#each FilterCategoriesSorted as categoryKey}
			<Accordion.Item
				value={categoryKey}
				classes="text-xs text-wrap"
				controlClasses={selectedItems[categoryKey] ? 'bg-primary-50' : ''}
			>
			{#snippet lead()}
			<input
			    class="checkbox"
				name="column_{categoryKey}"
				type="checkbox"
				checked={selectedItems[categoryKey] && selectedItems[categoryKey].length > 0}
				value=true
			/>
			<input
				class="hidden"
				name={categoryKey}
				value={selectedItems[categoryKey] ? selectedItems[categoryKey].join(',') : ''}
			/>
			{/snippet}
				{#snippet control()}
				{accordionItemsConfig[categoryKey].label}:
				<ul>
					{#each selectedItems[categoryKey] as itemLabel}
					<li>{itemLabel}</li>
					{/each}
				</ul>
				{/snippet}
				<!-- Panel -->
				{#snippet panel()}
					<SelectFilterCombox
					    options={accordionItemsConfig[categoryKey].options}
						categoryKey={categoryKey}
						selectedItems={selectedItems}
						transformedPicklist={transformedPicklists?.[categoryKey]}
				    />
				{/snippet}
			</Accordion.Item>
		{/each}
	</Accordion>
	<div class="flex justify-start">
		<button type="submit" class="btn preset-filled-primary-500 w-full">
			<Search />Apply Search Filter
		</button>
		<button type="submit" class="btn" onclick={handleReset}>
			<X />Reset
		</button>
	</div>
</form>