<script lang="ts">
	let {
		resultsTotal,
	} = $props();
</script>

<h1 class="mb-4 p-4 text-xl font-bold text-surface-800-200">
    Results ({resultsTotal})
</h1>
{#if !resultsTotal}
	<p>
		No results have been found.
	</p>
{/if}