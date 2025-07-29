<script lang="ts">
	import ContentLayout from '$lib/components/ContentLayout.svelte';
	import DisplayResults from '$lib/components/DisplayQleverResults.svelte';
	import ResultsHeaderSearch from '$lib/components/ResultsHeaderSearch.svelte';
	import SparqlSearchForm from '$lib/components/SparqlSearchForm.svelte';
	import { createDynamicTableHeaders } from '$lib/utils/mapSparqlResults'
	import { type FilterCategory } from '$lib/config';
	import Error from '../+error.svelte';

	let { data } = $props();
    // make sure the data is reladed after a page change
	const results = $derived(data.results);
	const picklists: Record<FilterCategory, string[]> = data.picklists;
	const initialFilters: Record<FilterCategory, string[]> = data.initialFilters;
	const resultColumns: FilterCategory[] = data.resultColumns as FilterCategory[];
	const resultsTotal: number = data.resultsTotal;
	const sparqlQuery: string = data.sparqlQuery;

	// Table Headers of Qlever Results
	const columnHeaders: Record<FilterCategory, string> = {
		CAMPAIGN_NAME: "Campaign Name",
		REACTION_TYPE: "Reaction Type",
		REACTION_NAME: "Reaction Name",
		CHEMICAL_NAME: "Chemical Name",
		CAS: "CAS",
		SMILES: "Smiles",
		DEVICES: "Devices",
	}

	export const resultTableHeaders = createDynamicTableHeaders(resultColumns, columnHeaders);

	interface LabelValueOption {
		label: string;
		value: string;
	}

	function transformArrayToLabelValue(stringArray: string[]): LabelValueOption[] {
		return stringArray.map(item => ({
			label: item,
			value: item,
		}));
	}

	const transformedCasNumbers = transformArrayToLabelValue(picklists.CAS || []);
	const transformedReactionTypes = transformArrayToLabelValue(picklists.REACTION_TYPE || []);
	const transformedChemicalNames = transformArrayToLabelValue(picklists.CHEMICAL_NAME || []);
	const transformedCampaignNames = transformArrayToLabelValue(picklists.CAMPAIGN_NAME || []);
	const transformedReactionNames = transformArrayToLabelValue(picklists.REACTION_NAME || []);
	const transformedSmiles = transformArrayToLabelValue(picklists.SMILES || []);
	const transformedDevices = transformArrayToLabelValue(picklists.DEVICES || []);
	const transformedPicklists: Record<FilterCategory, LabelValueOption[]> = {
		CAS: transformedCasNumbers,
		REACTION_TYPE: transformedReactionTypes,
		CHEMICAL_NAME: transformedChemicalNames,
		CAMPAIGN_NAME: transformedCampaignNames,
		REACTION_NAME: transformedReactionNames,
		SMILES: transformedSmiles,
		DEVICES: transformedDevices,
	};

</script>

{#snippet sidebar()}
<SparqlSearchForm
	picklists={picklists}
	initialFilters={initialFilters}
	transformedPicklists={transformedPicklists}
	resultColumns={resultColumns}
/>
{/snippet}

{#snippet main()}
	<ResultsHeaderSearch
		resultsTotal={resultsTotal}
		initialFilters={initialFilters}
		resultColumns={resultColumns}
		query={sparqlQuery}
		error={data.errorMessage}
	/>
	{#if results.length === 0 && !data.errorMessage}
		<div class="card w-full preset-filled-info-100-900 p-4 text-center">
			<p>No results found for your query.</p>
		</div>
	{:else if !data.errorMessage}
		<DisplayResults
			results={results}
			resultsTotal={resultsTotal}
			tableHeaders={resultTableHeaders}
		/>
	{/if}
{/snippet}

<ContentLayout {sidebar} {main} />
