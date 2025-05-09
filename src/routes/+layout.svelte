<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';

	let { children } = $props();
</script>

<!-- Layout for the application -->
<div class="grid h-screen grid-rows-[auto_1fr_auto]">
	<!-- Header -->
	<header>
		<Header />
	</header>
	<!-- Grid Columns -->
	<div class="grid grid-cols-1 md:grid-cols-[auto_1fr] items-start">
	    <!-- Main Content -->
		{@render children()}
	</div>
	<!-- Footer -->
	<footer class="p-4 text-center">Chemboard 2025</footer>
  </div>
