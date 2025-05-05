<script lang="ts">
	// The 'data' prop is automatically populated by SvelteKit
	// with the return value from the load function in +page.server.ts
	let { data, form } = $props();
	import Atom from '@lucide/svelte/icons/atom';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import TestTubes from '@lucide/svelte/icons/test-tubes';
	//import { Table } from '@skeletonlabs/skeleton-svelte';
	import Search from '@lucide/svelte/icons/search';
	type FilterCategory = 'chemicalName' | 'campaignName' | 'smiles' | 'cas' | 'reactionType' | 'reactionName';
	const filterSectionsConfig: {
		key: FilterCategory;
		label: string;
		list: string[];
		nameAttr: string;
	}[] = $derived([
		{ key: 'campaignName', label: 'Campaign Name', list: data.picklists?.campaignName ?? [], nameAttr: 'selected_campaign_names' },
		{ key: 'reactionType', label: 'Reaction Type', list: data.picklists?.reactionType ?? [], nameAttr: 'selected_reaction_types' },
		{ key: 'reactionName', label: 'Reaction Name', list: data.picklists?.reactionName ?? [], nameAttr: 'selected_reaction_names' },
		{ key: 'chemicalName', label: 'Chemical Name', list: data.picklists?.chemicalName ?? [], nameAttr: 'selected_chemicals' },
		{ key: 'cas', label: 'CAS Number', list: data.picklists?.cas ?? [], nameAttr: 'selected_cas' },
		{ key: 'smiles', label: 'SMILES', list: data.picklists?.smiles ?? [], nameAttr: 'selected_smiles' },
	]);
	//$inspect(accordionItemsConfig);
	//$inspect(form);
	//$inspect(data);

	// Define the structure for the state of each filter category
	interface SelectionState {
		selected: Set<string>;
		display: string; // Store the display string directly in the state
		active: boolean;
	}

	function initializeCategoryState(categoryKey: FilterCategory): SelectionState {
		const initialValues = data.initialFilters?.[categoryKey] ?? [];
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
	$inspect(selections);

    // --- Results and Table Source ---
    const displayResults = $derived(form?.results ?? data.results ?? []);
    const currentFilters = $derived(form?.filters ?? data.initialFilters ?? {}); // Filters used for display

	const tableBody = $derived(() => {
		return displayResults.map(row => [
			row.s3link?.value ?? '', row.campaignName?.value ?? '', row.chemicalName?.value ?? '',
			row.smiles?.value ?? '', row.cas?.value ?? '', row.reactionName?.value ?? '', row.reactionType?.value ?? '',
		]);
	});
	const tableSource = $derived({
		head: ['S3 Link', 'Campaign', 'Chemical', 'SMILES', 'CAS', 'Reaction', 'Type'],
		body: tableBody,
	});
</script>

<div class="container mx-auto p-4 md:p-8">
	<h1 class="mb-6 text-2xl font-bold text-gray-800">Metadata Search</h1>

	<div class="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 lg:gap-8">

		<aside class="card variant-ghost-surface p-4 space-y-4 self-start md:sticky md:top-4">
			<h2 class="text-2xl font-bold text-gray-800">Filters</h2>

			<form method="POST" action="?/search" id="filter-form" class="space-y-6">
				<button type="submit" class="btn variant-filled-primary w-full">
					<Search size={16} class="mr-1"/>
					<span>Apply Filters</span>
				</button>
				<div class="space-y-2">
					<h3 class="h3 flex items-center gap-2 text-sm uppercase font-semibold tracking-wide text-surface-500 dark:text-surface-400">
                        Active Filters
                    </h3>
					<div class="space-y-1 text-sm">
						{#each filterSectionsConfig as section (section.key)}
						    {#if selections[section.key].active}
							    <div class="p-1">
									<span class="font-medium text-surface-600 dark:text-surface-300">{section.label}:</span>
									<p class="ml-1 text-surface-500 dark:text-surface-400 break-normal" title={selections[section.key].display}>
										{selections[section.key].display}
									</p>
							    </div>
							{/if}
						{/each}
					</div>
                    <hr class="!my-4"/>
				</div>

				{#each filterSectionsConfig as section (section.key)}
					<div class="space-y-2">
						<h3 class="font-semibold text-primary-500 {selections[section.key].active ? 'font-bold' : ''}">{section.label}</h3>
						<div class="panel max-h-48 overflow-y-auto space-y-1 border rounded p-2">
							{#if section.list.length > 0}
								{#each section.list as optionValue (optionValue)}
									<label class="flex cursor-pointer items-center space-x-2 hover:bg-surface-100 dark:hover:bg-surface-800 p-1 rounded">
										<input
											class="checkbox checkbox-sm"
											type="checkbox"
											value={optionValue}
											name={section.nameAttr}
											checked={selections[section.key].selected.has(optionValue)}
											onchange={(e) => toggleGenericSelection(selections, section.key, optionValue, e.currentTarget.checked)}
										/>
										<p class="text-sm truncate" title={optionValue}>{optionValue}</p>
									</label>
								{/each}
							{:else}
								 <p class="text-sm italic text-surface-500">No options available.</p>
							{/if}
						</div>
					</div>
				{/each}
			</form>
		</aside>

		<main class="space-y-6">
            {#if form?.error}
                <div class="alert variant-filled-error">
                    <span>{form.error}</span>
                </div>
            {/if}
			<section class="card p-0 variant-ghost-surface">
				<header class="card-header flex justify-between items-center">
					<h2 class="text-2xl font-bold text-gray-800">Results ({displayResults.length})</h2>
                    </header>
				<div class="p-4">
					{#if displayResults.length > 0}
                        <p>results</p>
					{:else}
						<p class="text-center text-surface-500 p-4">No results found for the current filters.</p>
					{/if}
				</div>
			</section>
		</main>

	</div>
</div>
