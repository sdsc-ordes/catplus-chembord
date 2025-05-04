<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
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
	  <!-- Left Sidebar. -->
	  <aside class="p-4">
		<Sidebar />
	  </aside>
	  <!-- Main Content -->
	  <main class="space-y-4 p-4">
		{@render children()}
	  </main>
	</div>
	<!-- Footer -->
	<footer class="p-4">Chemboard 2025</footer>
  </div>

