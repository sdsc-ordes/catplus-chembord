<script>
    import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import Atom from '@lucide/svelte/icons/atom';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import TestTubes from '@lucide/svelte/icons/test-tubes';

	// --- Component Props ---
	// Define the structure for the picklist data received from the server
	interface PicklistData {
		chemicalName: string[];
		campaignName: string[];
		smiles: string[];
		cas: string[];
		reactionType: string[];
		reactionName: string[];
	}
	type FilterCategory = keyof PicklistData;

	// Define the structure for the state of each filter category
	interface SelectionState {
		selected: Set<string>;
		display: string;
		active: boolean;
	}

	// Props received from the parent page
	let {
		picklists, // The available options for filters
		initialFilters = {}, // Initial filter values (e.g., from URL params on load)
		selections = $bindable() // Use bindable() for two-way binding of the selections state
	}: {
		picklists: PicklistData;
		initialFilters?: Partial<Record<FilterCategory, string[]>>;
		selections?: Record<FilterCategory, SelectionState>; // Bindable prop
	} = $props();


	// --- Internal State & Logic ---

	// Helper function to initialize state for a category
	function initializeCategoryState(categoryKey: FilterCategory): SelectionState {
		// Initialize based ONLY on initialFilters prop passed in
		const initialValues = initialFilters?.[categoryKey] ?? [];
		const initialSet = new Set(initialValues);
		const initialDisplay = initialValues.length > 0 ? initialValues.join(', ') : 'Any';
		const initialActive = initialSet.size > 0;
		return { selected: initialSet, display: initialDisplay, active: initialActive };
	}

	// Initialize the internal selections state if not provided via binding
	// If bound, the parent's state will be used directly.
	if (!selections) {
		selections = $state<Record<FilterCategory, SelectionState>>({
			chemicalName: initializeCategoryState('chemicalName'),
			campaignName: initializeCategoryState('campaignName'),
			smiles: initializeCategoryState('smiles'),
			cas: initializeCategoryState('cas'),
			reactionType: initializeCategoryState('reactionType'),
			reactionName: initializeCategoryState('reactionName'),
		});
	}
	// $inspect(selections);


	// Generic Toggle Function (updates the bound 'selections' state)
	function toggleGenericSelection<T extends FilterCategory>(
		category: T,
		value: string,
		isChecked: boolean
	): void {
		const currentCategoryState = selections[category];
		if (!currentCategoryState) return;

		const updatedSet = new Set(currentCategoryState.selected);
		if (isChecked) updatedSet.add(value); else updatedSet.delete(value);

		// Update the properties of the existing state object directly
		// Svelte 5 reactivity tracks changes within the object bound via $bindable
		selections[category].selected = updatedSet;
		const selectedArray = [...updatedSet];
		selections[category].display = selectedArray.length > 0 ? selectedArray.join(', ') : 'Any';
		selections[category].active = updatedSet.size > 0;
		// console.log(`Updated ${category}:`, selections[category]);
	}

	// State for accordion open/close status (local to this component)
	let accordionValue = $state<string[]>([]);

	// Configuration for Filter Sections
	const filterSectionsConfig: {
		key: FilterCategory;
		label: string;
		list: string[];
		nameAttr: string;
	}[] = $derived([
		{ key: 'campaignName', label: 'Campaign Name', list: picklists?.campaignName ?? [], nameAttr: 'selected_campaign_names' },
		{ key: 'reactionType', label: 'Reaction Type', list: picklists?.reactionType ?? [], nameAttr: 'selected_reaction_types' },
		{ key: 'reactionName', label: 'Reaction Name', list: picklists?.reactionName ?? [], nameAttr: 'selected_reaction_names' },
		{ key: 'chemicalName', label: 'Chemical Name', list: picklists?.chemicalName ?? [], nameAttr: 'selected_chemicals' },
		{ key: 'cas', label: 'CAS Number', list: picklists?.cas ?? [], nameAttr: 'selected_cas' },
		{ key: 'smiles', label: 'SMILES', list: picklists?.smiles ?? [], nameAttr: 'selected_smiles' },
	]);

	// Active Filters for Display
	const activeFiltersForDisplay = $derived(
		filterSectionsConfig.filter(section => selections[section.key]?.active) // Check existence of selection state
	);
</script>
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
