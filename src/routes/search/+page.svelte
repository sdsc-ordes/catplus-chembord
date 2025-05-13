<script lang="ts">
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import ContentLayout from '$lib/components/ContentLayout.svelte';
	import Atom from '@lucide/svelte/icons/atom';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import TestTubes from '@lucide/svelte/icons/test-tubes';
	import { ResultsPerPage} from '$lib/const/campaign';
	import Search from '@lucide/svelte/icons/search';
	import IconArrowLeft from '@lucide/svelte/icons/arrow-left';
	import IconArrowRight from '@lucide/svelte/icons/arrow-right';
	import Campaign from '$lib/components/Campaign.svelte';
	import IconEllipsis from '@lucide/svelte/icons/ellipsis';
	import IconFirst from '@lucide/svelte/icons/chevrons-left';
	import IconLast from '@lucide/svelte/icons/chevron-right';
	import { s3LinkToUrlPath } from '$lib/utils/s3LinkParser';
	import { type S3FileInfo } from '$lib/schema/s3.js';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	import { mapSparqlResultsToTableBody } from '$lib/utils/mapSparqlResults';
	import type { FilterCategory } from './types.d';
	import { FilterCategoryConstants } from '$lib/const/search';
	import type { SelectionState } from '$lib/schema/search';
	import { initializeCategoryState, toggleGenericSelection } from '$lib/utils/searchForm';

	let { data, form } = $props();

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
	let size = ResultsPerPage;

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
	interface SourceData {
		s3link: string,
		campaignName: string,
		chemicalName: string,
		smiles: string,
		cas: string,
		reactionName: string,
		reactionType: string
	};
	const sourceData = $derived(mapSparqlResultsToTableBody(displayResults, tableKeysInOrder));
	const slicedSourceData = $derived(sourceData.slice((page - 1) * size, page * size));
	const slicedSource = $derived((s: SourceData[]) => s.slice((page - 1) * size, page * size));

	// State for the fetched detailed data for the main content
	let detailedContent = $state<S3FileInfo[] | null>(null);
	let isLoadingDetails = $state(false);
	let detailError = $state<string | null>(null);
	let activeResultItem = $state<SourceData[0] | null>(null);

    async function fetchDetails(path: string) {
        isLoadingDetails = true;
        detailError = null;
        detailedContent = null;
        try {
            // Adjust the URL to your actual API endpoint structure
			const correctedPath = s3LinkToUrlPath(path)
            const response = await fetch(`/api/${correctedPath}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message || `Failed to fetch details. Status: ${response.status}`);
            }
            const fetchedDetails: S3FileInfo[] = await response.json();
            detailedContent = fetchedDetails;
        } catch (err: any) {
            console.error('Error fetching details:', err);
            detailError = err.message || 'An unknown error occurred.';
        } finally {
            isLoadingDetails = false;
        }
    }

    function handleRowClick(row: string[]) {
        activeResultItem = row[0]; // Visually mark as active in sidebar
        if (row && row[0]) {
            fetchDetails(row[0]); // Fetch full details for the main content
        } else {
            // Reset main content if row is invalid or deselected (if implementing deselection)
            detailedContent = null;
            isLoadingDetails = false;
            detailError = null;
        }
	}

	function handlePageChange(e: Event) {
		page = e.page;
		activeResultItem = slicedSourceData[0];
		handleRowClick(activeResultItem);
	}

    $effect(() => {
        if (sourceData.length > 0 && activeResultItem === null) {
            const firstItem: SourceData = sourceData[0];
            handleRowClick(firstItem); // Use your existing handler
        }
    });
</script>

{#snippet sidebar()}
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
{/snippet}

{#snippet main()}
<div class="bg-tertiary-50 rounded space-y-4 p-4">
	<h1 class="mb-4 p-4 text-2xl bg-tertiary-50 font-bold text-gray-800">Results ({sourceData.length})</h1>
<div class="table-wrap">
	{#if activeResultItem}
	<table class="table-wrap table caption-bottom">
		<thead>
			<tr>
				{#each tableHead as header}
					<th>{header}</th>
				{/each}
			</tr>
		</thead>
		<tbody class="[&>tr]:hover:bg-tertiary-100">
			{#each slicedSourceData as row, rowIndex (rowIndex)}
				<tr
					onclick={() => handleRowClick(row)}
					class="cursor-pointer"
					class:bg-tertiary-200={activeResultItem === row[0]}
				>
					{#each row as cell, index}
						<td>
							{#if index === 0}
								{s3LinkToUrlPath(cell)}
							{:else}
								{cell}
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
	{/if}
</div>
<footer class="flex justify-between">
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
</div>
{#if activeResultItem}
<Campaign
	isLoading={isLoadingDetails}
	error={detailError}
	campaignFiles={detailedContent?.files}
	activeCampaign={activeResultItem}
	title={s3LinkToUrlPath(activeResultItem)}
/>
{/if}
{/snippet}

<ContentLayout {sidebar} {main} />
