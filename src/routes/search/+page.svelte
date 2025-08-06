<script lang="ts">
	import ContentLayout from '$lib/components/ContentLayout.svelte';
	import DisplayQleverResults from '$lib/components/DisplayQleverResults.svelte';
	import ResultsHeaderSearch from '$lib/components/ResultsHeaderSearch.svelte';
	import SparqlSearchForm from '$lib/components/SparqlSearchForm.svelte';
	import { type FilterCategory } from '$lib/config';

	let { data } = $props();
    // make sure the data is reladed after a page change
	const results = $derived(data.results);
	const picklists: Record<FilterCategory, string[]> = data.picklists;
	const initialFilters: Record<FilterCategory, string[]> = data.initialFilters;
	const resultColumns: string[] = data.resultColumns;
	const resultsTotal: number = data.resultsTotal && data.resultsTotal[0]?.count ? data.resultsTotal[0].count : 0;
	const sparqlQuery: string = $derived(data.sparqlQuery);

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
	/>
    {#if resultsTotal > 0}
        <DisplayQleverResults
            {results}
            {resultsTotal}
            tableHeaders={resultColumns}
        />
    {:else}
        <div class="bg-tertiary-50-800 space-y-4 rounded p-4">
            <h3 class="h3">No Results Found</h3>
            <p>Please try adjusting your filters or starting a new search.</p>
        </div>
    {/if}
{/snippet}

<ContentLayout {sidebar} {main} />
