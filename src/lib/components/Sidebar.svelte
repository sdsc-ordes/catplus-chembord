<script lang="ts">
	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconMenu from '@lucide/svelte/icons/menu';
	import Database from '@lucide/svelte/icons/database';
	import House from '@lucide/svelte/icons/house';
	import Search from '@lucide/svelte/icons/search';

	let isExpansed = $state(true);

	function toggleExpanded() {
		isExpansed = !isExpansed;
	}
</script>

<!-- Component -->
<Navigation.Rail expanded={isExpansed}>
	{#snippet header()}
		<Navigation.Tile labelExpanded="Menu" onclick={toggleExpanded} title="Toggle Menu Width"
			><IconMenu /></Navigation.Tile
		>
	{/snippet}
	{#snippet tiles()}
		<Navigation.Tile labelExpanded="Home" href="/">
			<House />
		</Navigation.Tile>
		<Navigation.Tile labelExpanded="Explore Database" href="/explorer">
			<Database />
		</Navigation.Tile>
		<Navigation.Tile labelExpanded="Search Metadata" href="/search">
			<Search />
		</Navigation.Tile>
	{/snippet}
</Navigation.Rail>
