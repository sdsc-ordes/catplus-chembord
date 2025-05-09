<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';

	let { children } = $props();
</script>

<!-- Layout for the application -->
<div class="grid h-screen grid-rows-[auto_1fr_auto]">
	<header>
		<Header />
	</header>
	{@render children()}
	<footer class="p-4 text-center">Chemboard 2025</footer>
</div>
