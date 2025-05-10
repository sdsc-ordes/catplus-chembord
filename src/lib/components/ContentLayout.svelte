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

<div class="grid grid-cols-1 md:grid-cols-[theme(spacing.96)_1fr]">
	<!-- Left Sidebar. -->
	<aside class="p-4 overflow-y-auto">
		{@render sidebar()}
	</aside>
	<!-- Main Content -->
	<main class="space-y-4 p-4 overflow-y-auto">
		{@render main()}
	</main>
</div>
