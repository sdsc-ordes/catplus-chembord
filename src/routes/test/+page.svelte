<script lang="ts">
    import ContentLayout from '$lib/components/ContentLayout.svelte';
    import { Pagination } from '@skeletonlabs/skeleton-svelte';
    // Icons
    import IconArrowLeft from '@lucide/svelte/icons/arrow-left';
    import IconArrowRight from '@lucide/svelte/icons/arrow-right';
    import IconEllipsis from '@lucide/svelte/icons/ellipsis';
    import IconFirst from '@lucide/svelte/icons/chevrons-left';
    import IconLast from '@lucide/svelte/icons/chevron-right';

    // Define the shape of the data for each row in your table
    // This should match what your `load` function provides in `data.tableData`
    interface TableRowData {
        position: number;
        name: string;
        // Add other properties if your `data.tableData` items have them
        // and you want to display them in the main section. For example:
        weight?: number;
        symbol?: string;
    }

    // 1. Get data from the load function
    let { data } = $props<{ tableData: TableRowData[] }>();
    $inspect('Data prop from load:', data);

    // 2. Initialize local reactive state for tableData using the prop
    // The `|| []` is a fallback in case data.tableData could be undefined (though load should provide it)
    let tableData = $state(data.tableData || []);
    $inspect('tableData $state after init:', tableData);

    // 3. State for sidebar pagination
    let page = $state(1);
    let size = $state(5);

    // 4. Derived state for the currently visible items in the sidebar table
    const slicedItems = $derived(tableData.slice((page - 1) * size, page * size));
    $inspect('slicedItems derived:', slicedItems);

    // 5. State to hold the data of the currently selected row
    let selectedRow = $state<TableRowData | null>(null);

    // 6. Function to update the selectedRow when a row is clicked
    function handleRowClick(row: TableRowData) {
        selectedRow = row;
        $inspect('Selected row:', selectedRow);
    }

    // 7. Function to handle page size change for sidebar pagination
    function handlePageSizeChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        size = Number(target.value);
        page = 1; // Reset to first page when size changes
    }
</script>

{#snippet sidebar()}
    <section class="space-y-4">
        <div class="table-wrap">
            <table class="table table-fixed caption-bottom">
                <thead>
                    <tr>
                        <th>Position</th>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody class="[&>tr]:hover:preset-tonal-primary">
                    {#if slicedItems && slicedItems.length > 0}
                        {#each slicedItems as row (row.position)}
                            <tr
                                onclick={() => handleRowClick(row)}
                                class="cursor-pointer"
                                class:bg-primary-100={selectedRow?.position === row.position}
                                class:font-semibold={selectedRow?.position === row.position}
                                class:text-primary-700={selectedRow?.position === row.position}
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
        <footer class="flex justify-between items-center mt-4">
            <select
                name="size"
                id="size"
                class="select max-w-[150px]"
                value={size}
                onchange={handlePageSizeChange}
            >
                {#each [1, 2, 5, 10] as v}
                    <option value={v}>Items {v}</option>
                {/each}
                {#if tableData.length > 0}
                    <option value={tableData.length}>Show All ({tableData.length})</option>
                {/if}
            </select>
            <Pagination
                data={tableData}
                bind:page={page}
                bind:pageSize={size}
                siblingCount={1}
            >
                {#snippet labelEllipsis()}<IconEllipsis class="size-4" />{/snippet}
                {#snippet labelNext()}<IconArrowRight class="size-4" />{/snippet}
                {#snippet labelPrevious()}<IconArrowLeft class="size-4" />{/snippet}
                {#snippet labelFirst()}<IconFirst class="size-4" />{/snippet}
                {#snippet labelLast()}<IconLast class="size-4" />{/snippet}
            </Pagination>
        </footer>
    </section>
{/snippet}

{#snippet main()}
    {#if selectedRow}
        <article class="p-6 card bg-surface-100 shadow-lg rounded-lg">
            <h1 class="text-2xl font-bold mb-4 text-primary-600 border-b pb-2">
                Details for: {selectedRow.name}
            </h1>
            <div class="space-y-2">
                <p><strong class="font-semibold text-gray-700 w-20 inline-block">Position:</strong> {selectedRow.position}</p>
                <p><strong class="font-semibold text-gray-700 w-20 inline-block">Name:</strong> {selectedRow.name}</p>
                {#if selectedRow.weight !== undefined}
                    <p><strong class="font-semibold text-gray-700 w-20 inline-block">Weight:</strong> {selectedRow.weight}</p>
                {/if}
                {#if selectedRow.symbol}
                    <p><strong class="font-semibold text-gray-700 w-20 inline-block">Symbol:</strong> {selectedRow.symbol}</p>
                {/if}
            </div>
        </article>
    {:else}
        <div class="flex items-center justify-center h-full text-gray-500">
            <p class="text-lg">Please select an item from the sidebar to view its details.</p>
        </div>
    {/if}
{/snippet}

<ContentLayout {sidebar} {main} />