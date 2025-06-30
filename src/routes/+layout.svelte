<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<!-- Layout for the application -->
<div class="grid h-screen grid-rows-[auto_1fr_auto]">
	<header>
		<Header />
	</header>
	{@render children()}
	<Footer />
</div>
