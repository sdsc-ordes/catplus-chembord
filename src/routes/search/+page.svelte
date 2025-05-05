<script lang="ts">
	// The 'data' prop is automatically populated by SvelteKit
	// with the return value from the load function in +page.server.ts
	let { data, form } = $props();
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import Atom from '@lucide/svelte/icons/atom';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import TestTubes from '@lucide/svelte/icons/test-tubes';
	import Plus from '@lucide/svelte/icons/plus';
    import Minus from '@lucide/svelte/icons/minus';
	type FilterCategory = 'chemicalName' | 'campaignName' | 'smiles' | 'cas' | 'reactionType' | 'reactionName';
	const accordionItemsConfig: {
		value: FilterCategory;
		label: string;
		icon: typeof Atom;
		list: string[];
		nameAttr: string; // Name attribute for form submission
	}[] = $derived([ // Ensure this updates if data.picklists changes
		{ value: 'campaignName', label: 'Campaign Name', icon: TestTubes, list: data.picklists?.campaignName ?? [], nameAttr: 'selected_campaign_names'},
		{ value: 'reactionType', label: 'Reaction Type', icon: FlaskConical, list: data.picklists?.reactionType ?? [], nameAttr: 'selected_reaction_types'},
		{ value: 'reactionName', label: 'Reaction Name', icon: FlaskConical, list: data.picklists?.reactionName ?? [], nameAttr: 'selected_reaction_names'},
		{ value: 'chemicalName', label: 'Chemical Name', icon: Atom, list: data.picklists?.chemicalName ?? [], nameAttr: 'selected_chemicals'},
		{ value: 'cas', label: 'CAS Number', icon: Atom, list: data.picklists?.cas ?? [], nameAttr: 'selected_cas'},
		{ value: 'smiles', label: 'SMILES', icon: Atom, list: data.picklists?.smiles ?? [], nameAttr: 'selected_smiles'},
	]);
	//$inspect(accordionItemsConfig);
	//console.log("========== next form")
	//$inspect(form);
	//console.log("========== end form")
	//console.log("-------- next data")
	//$inspect(data);
	//console.log("-------- end data")

	// Define the structure for the state of each filter category
	interface SelectionState {
		selected: Set<string>;
		display: string; // Store the display string directly in the state
		active: boolean;
	}

	interface AccordionValueChangeEventDetail {
        accordionValue: string[]; // Adjust the type based on your actual data
	}

	function initializeCategoryState(categoryKey: FilterCategory): SelectionState {
		const initialValues = data.initialFilters?.[categoryKey] ?? [];
		//console.log("*** initial values", initialValues);
		const initialSet = new Set(initialValues);
		const initialDisplay = initialValues.length > 0 ? initialValues.join(', ') : 'Any';
		const initialActive = initialSet.size > 0;
		return { selected: initialSet, display: initialDisplay, active: initialActive };
	}

	// --- Generic Toggle Function (updates Set and display string) ---
	function toggleGenericSelection<T extends FilterCategory>( // Use FilterCategory for better type safety
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

		// Create a new Set based on the current one
		const updatedSet = new Set(currentCategoryState.selected);
		if (isChecked) {
			updatedSet.add(value);
		} else {
			updatedSet.delete(value);
		}

		// Update the Set within the state object
		selectionsState[category].selected = updatedSet;

		// Update the display string directly within the state object
		const selectedArray = [...updatedSet];
		selectionsState[category].display = selectedArray.length > 0 ? selectedArray.join(', ') : 'Any';
		selectionsState[category].active = updatedSet.size > 0;

		// Svelte 5 reactivity should detect the change to the property
		// console.log(`Updated ${category}:`, selectionsState[category]);
	}

	let selections = $state<Record<FilterCategory, SelectionState>>({
		chemicalName: initializeCategoryState('chemicalName'),
		campaignName: initializeCategoryState('campaignName'),
		smiles: initializeCategoryState('smiles'),
		cas: initializeCategoryState('cas'),
		reactionType: initializeCategoryState('reactionType'),
		reactionName: initializeCategoryState('reactionName'),
	});
	//console.log("-------- selections")
	//$inspect(selections);
	//console.log("---end----- selections")
	let value = $state<string[]>([]);

	function logCurrentState() {
		console.log("Current 'selections' state:", selections);
		// Check a specific category
		console.log("Campaign Names Set:", selections.campaignName);

		// Directly check the DOM for a specific checkbox group
		const checkedCampaigns = document.querySelectorAll('input[name="selected_campaign_names"]:checked');
		console.log(`DOM Query: Found ${checkedCampaigns.length} checked campaign checkboxes.`);
		checkedCampaigns.forEach(input => console.log(`  - DOM Value: ${(input as HTMLInputElement).value}, DOM Checked: ${(input as HTMLInputElement).checked}`));
	}
</script>

<div class="container mx-auto p-4 font-sans md:p-8">
	<h1 class="mb-6 text-2xl font-bold text-gray-800">S3 Bucket Contents</h1>
	<p class="mb-4 text-gray-600">Search in Metadata</p>
	<div class="card preset-filled-surface-100-800 p-6">
		<form method="POST" action="?/search" class="mx-auto w-full max-w-md space-y-4">
			<Accordion {value} onValueChange={(e: Event) => (value = e.value)} multiple >
				{#snippet iconOpen()}<Plus size={16} />{/snippet}
                {#snippet iconClosed()}<Minus size={16} />{/snippet}
				{#each accordionItemsConfig as item}
				<Accordion.Item value={item.value} controlClasses={selections[item.value].active ? 'bg-secondary-100' : ''}>
					<!-- Control -->
					{#snippet lead()}<item.icon size={24} />{/snippet}
					{#snippet control()}{item.label}: {selections[item.value].display}{/snippet}
					<!-- Panel -->
					{#snippet panel()}
						{#each item.list as optionValue (optionValue)}
							<label class="flex cursor-pointer items-center space-x-2">
								<input
									class="checkbox"
									type="checkbox"
									value={optionValue}
									name={item.nameAttr}
									checked={selections[item.value].selected.has(optionValue)}
									onchange={(e) => toggleGenericSelection(selections, item.value, optionValue, e.currentTarget.checked)}
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
		<button type="button" class="btn variant-outline-surface mt-4" onclick={logCurrentState}>
			Log Current State & DOM Check
		</button>
	</div>
</div>
