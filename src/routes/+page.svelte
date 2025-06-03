<script lang="ts">
    import ContentLayout from '$lib/components/ContentLayout.svelte';
    import { base } from '$app/paths';
	import { QLEVER_UI_URL } from '$lib/config';
	import { ExternalLink } from '@lucide/svelte';
</script>

{#snippet sidebar()}
	<h1 class="mb-6 text-2xl font-bold text-gray-800">Cat Plus</h1>
	<section class="space-y-4">
		<div class="card preset-filled-surface-100-900 w-full max-w-md p-4 text-center">
			<img
				src="https://www.epfl.ch/research/facilities/swisscat/wp-content/uploads/Labo-20240209-1920x1080.jpg"
				alt="SwissCat"
				class="rounded-lg"
			/>
			<p class="text-sm text-gray-500">SwissCat+ Lab, EPFL, Lausanne, Switzerland</p>
		</div>
		<div class="card preset-filled-surface-100-900 w-full max-w-md p-4 text-center">
			<img
				src="https://www.epfl.ch/research/facilities/swisscat/wp-content/uploads/Schema-Mestrelab-e1684333653535.png"
				alt="SwissCat"
				class="rounded-lg"
			/>
			<p class="text-sm text-gray-500">Datainfrastructure of Cat Plus</p>
		</div>
		<div class="card preset-filled-surface-100-900 w-full max-w-md p-4 text-center">
			<img
				src="{base}/qlever.png"
				alt="Qlever"
				class="rounded-lg"
			/>
			<p class="text-sm text-gray-500">Qlever as Sparql Endpoint for Cat Plus</p>
		</div>
	</section>
{/snippet}

{#snippet main()}
	<h1 class="mb-6 p-4 text-2xl font-bold text-gray-800">An automated Catalysis Lab</h1>
	<h2 class="mb-6 p-4 text-xl font-bold"><a href="{base}/data" class="text-primary-500">Explore the data</a></h2>
	<p>Explore the campaigns by year / month / day</p>
	<h2 class="mb-6 p-4 text-xl font-bold"><a href="{base}/search" class="text-primary-500">Search in the Campaigns</a></h2>
	<p>You can search Campaigns by a variety of search criteria:</p>
	<ul class="mb-6 p-4 list-disc">
		<li>Campaign Name</li>
		<li>Reaction Type</li>
		<li>Reaction Name</li>
		<li>Chemical Name</li>
		<li>CAS Number</li>
		<li>SMILES</li>
		<li>Device</li>
	</ul>
	<h2 class="mb-6 p-4 text-xl font-bold">Search with Sparql</h2>
	<p class="leading-normal">
		You can use our
		<a
			href="{QLEVER_UI_URL}"
			target="_blank"
			class="inline-flex items-center text-primary-500 hover:text-primary-600 align-baseline"
		>
			<ExternalLink class="h-4 w-4" />
			<span class="ml-1">Sparql Endpoint</span>
		</a>
		to query the data directly via Sparql.
	</p>

{/snippet}

<ContentLayout {sidebar} {main} />
