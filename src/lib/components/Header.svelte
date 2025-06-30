<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import { base } from '$app/paths';
	import Home from '@lucide/svelte/icons/home';
	import Database from '@lucide/svelte/icons/database';
	import Search from '@lucide/svelte/icons/search';
	import { publicConfig } from '$lib/config';
</script>

<AppBar 
    classes="flex items-left"
	gridColumns="grid-cols-3"
    slotLead="place-self-start"
    slotDefault="place-self-center"
    slotTrail="place-self-end"
    class="p-4"
>
	{#snippet lead()}
	    <a href="{base}/" class="flex items-center mx-4 gap-x-2"><Home size={20} />Home</a>
	    <a href="{base}/search" class="flex items-center mx-4 gap-x-2"><Search size={20} />Search</a>
		<a href="{base}/data" class="flex items-center mx-4 gap-x-2"><Database size={20} />Data</a>
	{/snippet}
	<span class="text-2xl font-bold">HT Chemboard</span>
	{#snippet trail()}
		<a href="{publicConfig.PUBLIC_CHEMBOARD_GITHUB_URL}"
		   target="_blank" rel="noopener" class="opacity-75 hover:opacity-100 transition-opacity">
			<img
				src="{base}/github-mark.png"
				alt="Github repository"
				class="h-10 w-auto"
			/>
		</a>
	{/snippet}
</AppBar>