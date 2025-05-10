<script lang="ts">
    import ContentLayout from '$lib/components/ContentLayout.svelte';
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
	</section>
{/snippet}

{#snippet main()}
	<h1 class="mb-6 p-4 text-2xl font-bold text-gray-800">An automated Catalysis Lab</h1>
	<p>Exlore the data</p>
	<p>Search in the Campaigns</p>
{/snippet}

<ContentLayout {sidebar} {main} />
