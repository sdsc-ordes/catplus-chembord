// +page.svelte
<script lang="ts">
    import ContentLayout from '$lib/components/ContentLayout.svelte';
    import { Pagination } from '@skeletonlabs/skeleton-svelte';
    // Icons (ensure all used in THIS file are imported)
    import IconArrowLeft from '@lucide/svelte/icons/arrow-left';
    import IconArrowRight from '@lucide/svelte/icons/arrow-right';
    import IconEllipsis from '@lucide/svelte/icons/ellipsis';
    import IconFirst from '@lucide/svelte/icons/chevrons-left';
    import IconLast from '@lucide/svelte/icons/chevron-right';

    // Import the new DetailDisplay component
    import DetailDisplay from '$lib/components/DetailDisplay.svelte';

    // Define your data structures (consider moving to a shared types file in $lib/types)
    interface SidebarRowData {
        position: number;
        name: string;
    }

    interface DetailedElementData extends SidebarRowData {
        weight?: number;
        symbol?: string;
        notes?: string;
    }

    let { data } = $props<{ tableData: SidebarRowData[] }>();
    $inspect('Data prop from load:', data);

    let tableDataForSidebar = $state(data.tableData || []);
    $inspect('tableDataForSidebar $state after init:', tableDataForSidebar);

    let sidebarPage = $state(1);
    let sidebarPageSize = $state(5);
    const slicedSidebarItems = $derived(tableDataForSidebar.slice((sidebarPage - 1) * sidebarPageSize, sidebarPage * sidebarPageSize));
    $inspect('slicedSidebarItems derived:', slicedSidebarItems);

    let activeSidebarItem = $state<SidebarRowData | null>(null);
    let detailedContent = $state<DetailedElementData | null>(null);
    let isLoadingDetails = $state(false);
    let detailError = $state<string | null>(null);

    async function fetchDetails(position: number) {
        isLoadingDetails = true;
        detailError = null;
        // detailedContent = null; // Cleared in handleRowClick before calling fetchDetails

        try {
            const response = await fetch(`/api/details/${position}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message || `Failed to fetch details. Status: ${response.status}`);
            }
            const fetchedDetails: DetailedElementData = await response.json();
            // Ensure we're still trying to load details for the currently active item
            if (activeSidebarItem && activeSidebarItem.position === position) {
                detailedContent = fetchedDetails;
            }
        } catch (err: any) {
            console.error('Error fetching details:', err);
            if (activeSidebarItem && activeSidebarItem.position === position) {
                detailError = err.message || 'An unknown error occurred.';
            }
        } finally {
             if (activeSidebarItem && activeSidebarItem.position === position) {
                isLoadingDetails = false;
            }
        }
    }

    function handleRowClick(row: SidebarRowData) {
        if (activeSidebarItem?.position === row.position && detailedContent && !isLoadingDetails) {
            // Item already selected and details loaded, do nothing or allow re-fetch
             $inspect('Row already active, not re-fetching unless specified.');
            return; 
        }
        
        activeSidebarItem = row;
        detailedContent = null; // Clear previous details immediately
        detailError = null;     // Clear previous errors
        isLoadingDetails = true; // Set loading true before fetch call

        if (row && row.position != null) {
            fetchDetails(row.position);
        } else {
            isLoadingDetails = false; // Not fetching if row or position is invalid
        }
        $inspect('Clicked row in sidebar:', activeSidebarItem);
    }

    function handlePageSizeChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        sidebarPageSize = Number(target.value);
        sidebarPage = 1;
    }

    $effect(() => {
        if (tableDataForSidebar.length > 0 && activeSidebarItem === null && !isLoadingDetails) {
            const firstItem = tableDataForSidebar[0];
            $inspect('Auto-selecting first item:', firstItem);
            handleRowClick(firstItem);
        }
    });
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
    <DetailDisplay
        isLoading={isLoadingDetails}
        error={detailError}
        details={detailedContent}
        activeItemName={activeSidebarItem?.name}
    />
{/snippet}

<ContentLayout {sidebar} {main} />