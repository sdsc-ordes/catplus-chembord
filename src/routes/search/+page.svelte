<script lang="ts">
	// The 'data' prop is automatically populated by SvelteKit
	// with the return value from the load function in +page.server.ts
	let { data } = $props();
	//console.log(data);
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import Atom from '@lucide/svelte/icons/atom';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import TestTubes from '@lucide/svelte/icons/test-tubes';

	let value = $state(['chemicalName']);
	let selectedCampaignNames = $state(new Set<string>());
	const selectedCampaignNamesDisplay = $derived([...selectedCampaignNames].join(', ') || 'Any');
	function toggleCampaignNames(name: string, isChecked: boolean) {
		const updatedSet = new Set(selectedCampaignNames); // Create mutable copy for reactivity
		if (isChecked) {
			updatedSet.add(name);
		} else {
			updatedSet.delete(name);
		}
		selectedCampaignNames = updatedSet; // Assign back to update state
		//console.log('Selected CampaignNames:', selectedCampaignNames); // For debugging
	}
	let selectedReactionNames = $state(new Set<string>());
	const selectedReactionNamesDisplay = $derived([...selectedReactionNames].join(', ') || 'Any');
	function toggleReactionNames(name: string, isChecked: boolean) {
		const updatedSet = new Set(selectedReactionNames); // Create mutable copy for reactivity
		if (isChecked) {
			updatedSet.add(name);
		} else {
			updatedSet.delete(name);
		}
		selectedReactionNames = updatedSet; // Assign back to update state
		//console.log('Selected ReactionNames:', selectedReactionNames); // For debugging
	}
	let selectedReactionTypes = $state(new Set<string>());
	const selectedReactionTypesDisplay = $derived([...selectedReactionTypes].join(', ') || 'Any');
	function toggleReactionTypes(type: string, isChecked: boolean) {
		const updatedSet = new Set(selectedReactionTypes); // Create mutable copy for reactivity
		if (isChecked) {
			updatedSet.add(type);
		} else {
			updatedSet.delete(type);
		}
		selectedReactionTypes = updatedSet; // Assign back to update state
		//console.log('Selected ReactionTypes:', selectedReactionTypes); // For debugging
	}
	let selectedChemicals = $state(new Set<string>());
	const selectedChemicalsDisplay = $derived([...selectedChemicals].join(', ') || 'Any');
	function toggleChemical(name: string, isChecked: boolean) {
		const updatedSet = new Set(selectedChemicals); // Create mutable copy for reactivity
		if (isChecked) {
			updatedSet.add(name);
		} else {
			updatedSet.delete(name);
		}
		selectedChemicals = updatedSet; // Assign back to update state
		//console.log('Selected Chemicals:', selectedChemicals); // For debugging
	}
	let selectedCas = $state(new Set<string>());
	const selectedCasDisplay = $derived([...selectedCas].join(', ') || 'Any');
	function toggleCas(cas: string, isChecked: boolean) {
		const updatedSet = new Set(selectedCas); // Create mutable copy for reactivity
		if (isChecked) {
			updatedSet.add(cas);
		} else {
			updatedSet.delete(cas);
		}
		selectedCas = updatedSet; // Assign back to update state
		//console.log('Selected Cas:', selectedCas); // For debugging
	}
	let selectedSmiles = $state(new Set<string>());
	const selectedSmilesDisplay = $derived([...selectedSmiles].join(', ') || 'Any');
	function toggleSmiles(smiles: string, isChecked: boolean) {
		const updatedSet = new Set(selectedSmiles); // Create mutable copy for reactivity
		if (isChecked) {
			updatedSet.add(smiles);
		} else {
			updatedSet.delete(smiles);
		}
		selectedSmiles = updatedSet; // Assign back to update state
		//console.log('Selected Smiles:', selectedSmiles); // For debugging
	}
	let accordionValue = $state(['chemicals']);
</script>

<div class="container mx-auto p-4 font-sans md:p-8">
	<h1 class="mb-6 text-2xl font-bold text-gray-800">S3 Bucket Contents</h1>
	<p class="mb-4 text-gray-600">Search in Metadata</p>
	<div class="card preset-filled-surface-100-800 p-6">
		<form method="POST" action="?/search" class="mx-auto w-full max-w-md space-y-4">
			<input name="hello" />
			<Accordion {value} onValueChange={(e) => (value = e.value)} multiple>
				<Accordion.Item value="campaignName">
					<!-- Control -->
					{#snippet lead()}<TestTubes size={24} />{/snippet}
					{#snippet control()}Campaign Name: {selectedCampaignNamesDisplay}{/snippet}
					<!-- Panel -->
					{#snippet panel()}
						{#each data.picklists.campaignName as campaignName (campaignName)}
							<label class="flex cursor-pointer items-center space-x-2">
								<input
									class="checkbox"
									type="checkbox"
									value={campaignName}
									name="selected_campaign_names"
									checked={selectedCampaignNames.has(campaignName)}
									onchange={(e) => toggleCampaignNames(campaignName, e.currentTarget.checked)}
								/>
								<p>{campaignName}</p>
							</label>
						{/each}
					{/snippet}
				</Accordion.Item>
				<Accordion.Item value="reactionType">
					<!-- Control -->
					{#snippet lead()}<FlaskConical size={24} />{/snippet}
					{#snippet control()}Reaction Type: {selectedReactionTypesDisplay}{/snippet}
					<!-- Panel -->
					{#snippet panel()}
						{#each data.picklists.reactionType as reactionType (reactionType)}
							<label class="flex cursor-pointer items-center space-x-2">
								<input
									class="checkbox"
									type="checkbox"
									value={reactionType}
									name="selected_reaction_types"
									checked={selectedReactionTypes.has(reactionType)}
									onchange={(e) => toggleReactionTypes(reactionType, e.currentTarget.checked)}
								/>
								<p>{reactionType}</p>
							</label>
						{/each}
					{/snippet}
				</Accordion.Item>
				<Accordion.Item value="reactionName">
					<!-- Control -->
					{#snippet lead()}<FlaskConical size={24} />{/snippet}
					{#snippet control()}Reaction Name: {selectedReactionNamesDisplay}{/snippet}
					<!-- Panel -->
					{#snippet panel()}
						{#each data.picklists.reactionName as reactionName (reactionName)}
							<label class="flex cursor-pointer items-center space-x-2">
								<input
									class="checkbox"
									type="checkbox"
									value={reactionName}
									name="selected_reaction_names"
									checked={selectedReactionNames.has(reactionName)}
									onchange={(e) => toggleReactionNames(reactionName, e.currentTarget.checked)}
								/>
								<p>{reactionName}</p>
							</label>
						{/each}
					{/snippet}
				</Accordion.Item>
				<Accordion.Item value="chemicalName">
					<!-- Control -->
					{#snippet lead()}<Atom size={24} />{/snippet}
					{#snippet control()}Chemical Name: {selectedChemicalsDisplay}{/snippet}
					<!-- Panel -->
					{#snippet panel()}
						{#each data.picklists.chemicalName as chemicalName (chemicalName)}
							<label class="flex cursor-pointer items-center space-x-2">
								<input
									class="checkbox"
									type="checkbox"
									value={chemicalName}
									name="selected_chemicals"
									checked={selectedChemicals.has(chemicalName)}
									onchange={(e) => toggleChemical(chemicalName, e.currentTarget.checked)}
								/>
								<p>{chemicalName}</p>
							</label>
						{/each}
					{/snippet}
				</Accordion.Item>
				<Accordion.Item value="cas">
					<!-- Control -->
					{#snippet lead()}<Atom size={24} />{/snippet}
					{#snippet control()}Cas: {selectedCasDisplay}{/snippet}
					<!-- Panel -->
					{#snippet panel()}
						{#each data.picklists.cas as cas (cas)}
							<label class="flex cursor-pointer items-center space-x-2">
								<input
									class="checkbox"
									type="checkbox"
									value={cas}
									name="selected_cas"
									checked={selectedCas.has(cas)}
									onchange={(e) => toggleCas(cas, e.currentTarget.checked)}
								/>
								<p>{cas}</p>
							</label>
						{/each}
					{/snippet}
				</Accordion.Item>
				<Accordion.Item value="smiles">
					<!-- Control -->
					{#snippet lead()}<Atom size={24} />{/snippet}
					{#snippet control()}Smiles: {selectedSmilesDisplay}{/snippet}
					<!-- Panel -->
					{#snippet panel()}
						{#each data.picklists.smiles as smiles (smiles)}
							<label class="flex cursor-pointer items-center space-x-2">
								<input
									class="checkbox"
									type="checkbox"
									value={smiles}
									name="selected_smiles"
									checked={selectedSmiles.has(smiles)}
									onchange={(e) => toggleSmiles(smiles, e.currentTarget.checked)}
								/>
								<p>{smiles}</p>
							</label>
						{/each}
					{/snippet}
				</Accordion.Item>
			</Accordion>
			<div class="flex justify-start">
				<button type="submit" class="btn preset-filled-primary-500">
					<span>Search</span>
				</button>
			</div>
		</form>
	</div>
</div>
