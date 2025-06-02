<script lang="ts">
	import ContentLayout from '$lib/components/ContentLayout.svelte';
	import DisplayResults from '$lib/components/DisplayResults.svelte';
	import SparqlSearchForm from '$lib/components/SparqlSearchForm.svelte';
	import { type FilterCategory } from '$lib/config';

	let { data } = $props();

	const results = data.results;
	const picklists: Record<FilterCategory, string[]> = data.picklists;
	const initialFilters: Record<FilterCategory, string[]> = data.initialFilters;


	// Table Headers of Qlever Results
	const HeadersQleverResults: string[] = [
		"Campaign Path", "Campaign Name", "Reaction Type", "Reaction Type", "Chemicals (Name, Cas, Smiles)"
	]

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
	const transformedPicklists: Record<FilterCategory, LabelValueOption[]> = {
		CAS: transformedCasNumbers,
		REACTION_TYPE: transformedReactionTypes,
		CHEMICAL_NAME: transformedChemicalNames,
		CAMPAIGN_NAME: transformedCampaignNames,
		REACTION_NAME: transformedReactionNames,
		SMILES: transformedSmiles
	};
</script>

{#snippet sidebar()}
<SparqlSearchForm
    picklists={picklists}
	initialFilters={initialFilters}
	transformedPicklists={transformedPicklists}
/>
{/snippet}

{#snippet main()}
<DisplayResults
    results={results}
	tableHeaders={HeadersQleverResults}
/>
{/snippet}

<ContentLayout {sidebar} {main} />
