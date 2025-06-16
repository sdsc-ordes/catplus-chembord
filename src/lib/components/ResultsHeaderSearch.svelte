<script lang="ts">
	import { publicConfig } from '$lib/config';
	import { ExternalLink } from '@lucide/svelte';

	// get props from data loader
	let {
		resultsTotal,
        initialFilers,
        resultColumns,
		query,
	} = $props();

	// Encode the query string for display
	const encodedQuery = encodeURIComponent(query);
	const qleverUrl = `${publicConfig.PUBLIC_QLEVER_UI_URL}?query=${encodedQuery}`;

	let showQuery = $state(false);
    $inspect("initialFilters", initialFilers);
    $inspect("resultColumns", resultColumns);
</script>

<h1 class="mb-4 p-4 text-xl font-bold text-surface-800-200">
    Results ({resultsTotal})
</h1>
<p>{initialFilers}</p>
<p>{resultColumns}</p>
<p class="text-sm">
    You can execute the query at the QleverUI: be aware that the results will not be aggregated yet:
</p>
<div class="flex items-center justify-start space-x-6">
    <a
        href={qleverUrl}
        target="_blank"
        class="inline-flex items-center text-primary-500 hover:text-primary-600"
    >
        Copy query to Qlever UI
        <ExternalLink class="ml-1 h-4 w-4" />
    </a>
    <div class="flex items-center space-x-2">
        <input
            type="checkbox"
            id="show-query-checkbox"
            bind:checked={showQuery}
            class="checkbox bg-surface-50-950"
        />
        <label for="show-query-checkbox" class="cursor-pointer text-sm">Show SPARQL Query</label>
    </div>
</div>
{#if query && showQuery}
    <div class="text-xs font-mono bg-primary w-fit p-2">
        <pre><code>{query}</code></pre>
    </div>
{/if}
