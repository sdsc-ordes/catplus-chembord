<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		sidebar,
		main
	}: {
		sidebar?: Snippet;
		main?: Snippet;
	} = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-[auto_1fr]">
	<!-- Left Sidebar. -->
	<aside class="bg-tertiary-50 p-4">
		{@render sidebar()}
	</aside>
	<!-- Main Content -->
	<main class="space-y-4 p-4">
		{@render main()}
	</main>
</div>
