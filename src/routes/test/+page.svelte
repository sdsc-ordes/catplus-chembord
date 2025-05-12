// +page.svelte
<script lang="ts">
    import ContentLayout from '$lib/components/ContentLayout.svelte';
    import { Pagination } from '@skeletonlabs/skeleton-svelte';

    // ... other imports ...

    // Basic data for rows in the sidebar (from initial load)
    interface SidebarRowData {
        position: number;
        name: string;
    }

    // Detailed data structure expected from the API
    interface DetailedElementData extends SidebarRowData {
        weight?: number;
        symbol?: string;
        notes?: string; // Example additional detail
    }

    let { data } = $props<{ tableData: SidebarRowData[] }>();

    let tableDataForSidebar = $state(data.tableData || []);

    let sidebarPage = $state(1);
    let sidebarPageSize = $state(5);
    const slicedSidebarItems = $derived(tableDataForSidebar.slice((sidebarPage - 1) * sidebarPageSize, sidebarPage * sidebarPageSize));

    // State for the currently selected item's basic info (from sidebar click)
    let activeSidebarItem = $state<SidebarRowData | null>(null);

    // State for the fetched detailed data for the main content
    let detailedContent = $state<DetailedElementData | null>(null);
    let isLoadingDetails = $state(false);
    let detailError = $state<string | null>(null);

    async function fetchDetails(position: number) {
        isLoadingDetails = true;
        detailError = null;
        detailedContent = null; // Clear previous details

        try {
            // Adjust the URL to your actual API endpoint structure
            const response = await fetch(`/api/details/${position}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message || `Failed to fetch details. Status: ${response.status}`);
            }
            const fetchedDetails: DetailedElementData = await response.json();
            detailedContent = fetchedDetails;
        } catch (err: any) {
            console.error('Error fetching details:', err);
            detailError = err.message || 'An unknown error occurred.';
        } finally {
            isLoadingDetails = false;
        }
    }

    function handleRowClick(row: SidebarRowData) {
        activeSidebarItem = row; // Visually mark as active in sidebar
        if (row && row.position) {
            fetchDetails(row.position); // Fetch full details for the main content
        } else {
            // Reset main content if row is invalid or deselected (if implementing deselection)
            detailedContent = null;
            isLoadingDetails = false;
            detailError = null;
        }
        $inspect('Clicked row in sidebar:', activeSidebarItem);
    }

    function handlePageSizeChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        sidebarPageSize = Number(target.value);
        sidebarPage = 1;
    }

    $effect(() => {
        if (tableDataForSidebar.length > 0 && activeSidebarItem === null) {
            const firstItem = tableDataForSidebar[0];
            $inspect('Auto-selecting first item:', firstItem);
            handleRowClick(firstItem); // Use your existing handler
        }
    });
</script>

{#snippet sidebar()}
    <section class="space-y-4">
        <!-- Table -->
        <div class="table-wrap">
            <table class="table table-fixed caption-bottom">
                <thead>
                    <tr>
                        <th>Position</th>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody class="[&>tr]:hover:preset-tonal-primary">
                    {#if slicedSidebarItems && slicedSidebarItems.length > 0}
                        {#each slicedSidebarItems as row (row.position)}
                            <tr
                                onclick={() => handleRowClick(row)}
                                class="cursor-pointer"
                                class:bg-primary-100={activeSidebarItem?.position === row.position}
                                class:font-semibold={activeSidebarItem?.position === row.position}
                                class:text-primary-700={activeSidebarItem?.position === row.position}
                            >
                                <td class="py-2 px-3">{row.position}</td>
                                <td class="py-2 px-3">{row.name}</td>
                            </tr>
                        {/each}
                    {:else}
                        <tr>
                            <td colspan="2" class="text-center p-4 text-gray-500">
                                No items to display.
                            </td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        </div>
        <!-- Footer -->
        <footer class="flex justify-between items-center mt-4">
            <select
                name="size"
                id="size"
                class="select max-w-[150px]"
                bind:value={sidebarPageSize}
                onchange={handlePageSizeChange}
            >
                {#each [1, 2, 5, 10] as v}
                    <option value={v}>Items {v}</option>
                {/each}
                {#if tableDataForSidebar.length > 0}
                    <option value={tableDataForSidebar.length}>Show All ({tableDataForSidebar.length})</option>
                {/if}
            </select>
            <Pagination
                data={tableDataForSidebar}
                bind:page={sidebarPage}
                bind:pageSize={sidebarPageSize}
                siblingCount={1}
            >
                <!-- ... icon snippets ... -->
            </Pagination>
        </footer>
    </section>
{/snippet}

{#snippet main()}
    {#if isLoadingDetails}
        <div class="p-6 text-center text-gray-500">
            <p>Loading details...</p>
            <!-- You could add a spinner component here -->
        </div>
    {:else if detailError}
        <div class="p-6 card bg-error-100 text-error-700">
            <h2 class="text-xl font-semibold mb-2">Error</h2>
            <p>{detailError}</p>
        </div>
    {:else if detailedContent}
        <article class="p-6 card bg-surface-100 shadow-lg rounded-lg">
            <h1 class="text-2xl font-bold mb-4 text-primary-600 border-b pb-2">
                Details for: {detailedContent.name}
            </h1>
            <div class="space-y-2">
                <p><strong class="font-semibold text-gray-700 w-24 inline-block">Position:</strong> {detailedContent.position}</p>
                <p><strong class="font-semibold text-gray-700 w-24 inline-block">Name:</strong> {detailedContent.name}</p>
                {#if detailedContent.weight !== undefined}
                    <p><strong class="font-semibold text-gray-700 w-24 inline-block">Weight:</strong> {detailedContent.weight}</p>
                {/if}
                {#if detailedContent.symbol}
                    <p><strong class="font-semibold text-gray-700 w-24 inline-block">Symbol:</strong> {detailedContent.symbol}</p>
                {/if}
                {#if detailedContent.notes}
                    <p class="mt-4"><strong class="font-semibold text-gray-700 block mb-1">Notes:</strong> <span class="block pl-2 border-l-2 border-primary-200">{detailedContent.notes}</span></p>
                {/if}
            </div>
        </article>
    {:else if activeSidebarItem}
        <!-- This state might occur if a row is clicked but fetch hasn't started or completed without error -->
        <div class="p-6 text-center text-gray-500">
            <p>Select an item or wait for details to load for {activeSidebarItem.name}.</p>
        </div>
    {:else}
        <div class="flex items-center justify-center h-full text-gray-500">
            <p class="text-lg">Please select an item from the sidebar to view its details.</p>
        </div>
    {/if}
{/snippet}

<ContentLayout {sidebar} {main} />