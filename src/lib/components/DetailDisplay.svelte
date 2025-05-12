<script lang="ts">
    import Archive from '@lucide/svelte/icons/archive'; // For the title icon

    // Define the props this component will accept.
    // This interface should match or be compatible with DetailedElementData from your page.
    interface DetailProps {
        position: number;
        name: string;
        weight?: number;
        symbol?: string;
        notes?: string;
    }

    let {
        isLoading = false,
        error = null,
        details = null,
        activeItemName = null // Name of the item initially selected, before details might load
    }: {
        isLoading?: boolean;
        error?: string | null;
        details?: DetailProps | null;
        activeItemName?: string | null;
    } = $props();
</script>

{#if isLoading}
    <div class="p-6 text-center text-gray-500 animate-pulse">
        <p>Loading details...</p>
        </div>
{:else if error}
    <div class="p-6 card bg-error-100 text-error-700 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-2">Error Fetching Details</h2>
        <p>{error}</p>
    </div>
{:else if details}
    <article class="p-6 card bg-surface-100 shadow-lg rounded-lg">
        <h1 class="mb-6 flex items-center gap-x-2 text-2xl font-bold text-primary-600 border-b border-gray-300 pb-3">
            <Archive class="w-7 h-7 text-primary-500" />
            <span>Details for: {details.name}</span>
        </h1>
        <div class="space-y-3">
            <p><strong class="font-semibold text-gray-700 w-28 inline-block">Position:</strong> {details.position}</p>
            <p><strong class="font-semibold text-gray-700 w-28 inline-block">Name:</strong> {details.name}</p>
            {#if details.weight !== undefined}
                <p><strong class="font-semibold text-gray-700 w-28 inline-block">Weight:</strong> {details.weight}</p>
            {/if}
            {#if details.symbol}
                <p><strong class="font-semibold text-gray-700 w-28 inline-block">Symbol:</strong> {details.symbol}</p>
            {/if}
            {#if details.notes}
                <p class="mt-4">
                    <strong class="font-semibold text-gray-700 block mb-1">Notes:</strong>
                    <span class="block pl-3 border-l-2 border-primary-300 text-gray-600">{details.notes}</span>
                </p>
            {/if}
        </div>
    </article>
{:else if activeItemName}
    <div class="p-6 text-center text-gray-500">
        <p>Preparing details for {activeItemName}...</p>
    </div>
{:else}
    <div class="flex items-center justify-center h-full text-gray-500">
        <p class="text-lg">Please select an item from the sidebar to view its details.</p>
    </div>
{/if}
