<script lang="ts">
	import Product from '$lib/components/Product.svelte';
	import { filterCampaignFiles } from '$lib/utils/filterCampaign';
	import { publicConfig } from '$lib/config';
	import type { S3FileInfo } from '$lib/server/s3';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	/**
	 * A generic interface for a value that can be toggled for display.
	 * T represents the type of the 'value'.
	 */
	interface DisplayValue<T> {
		value: T;
		display: boolean;
	}

	/**
	 * Represents the main data structure for a single result item.
	 */
	interface ResultItemType {
		Campaign: DisplayValue<string>;
		Product: DisplayValue<string>;
		Devices: DisplayValue<string[]>;
		Chemicals: DisplayValue<string[]>;
		Peaks: DisplayValue<string[]>;
		ContentURL: DisplayValue<string>;
		ProductFile: DisplayValue<string>;
	}

	let currentPage = $derived(Number(page.url.searchParams.get('page')) || 1);

	// get props from data loader
	let { results, resultsTotal, tableHeaders } = $props();

	const headers = Object.values(tableHeaders);

	// Pagination of Campaigns
	let pageSize = publicConfig.PUBLIC_RESULTS_PER_PAGE;

	// State for the fetched detailed data for the main content
	let detailedContent = $state<S3FileInfo[] | null>(null);
	let rawCampaignFiles = $state<S3FileInfo[] | null>(null);
	let fetchedCampaignPath = $state<string | null>(null);
	let isLoadingDetails = $state(false);
	let detailError = $state<string | null>(null);
	let selectedRowIndex = $state<number | null>(null);
	const activeResultItem = $derived(selectedRowIndex === null ? null : results[selectedRowIndex]);

	async function fetchDetails(activeResultItem: ResultItemType) {
		const campaignPath = activeResultItem.Campaign.value;

		// If the requested campaign is the one we already have, do nothing.
		// The reactive effect below will handle re-filtering.
		if (!campaignPath || campaignPath === fetchedCampaignPath) {
			return;
		}

		isLoadingDetails = true;
		detailError = null;
		rawCampaignFiles = null; // Clear old raw data

		try {
			const response = await fetch(`${base}/api/${campaignPath}`);
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
				throw new Error(errorData.message || `Failed to fetch details. Status: ${response.status}`);
			}

			const fetchedData = await response.json();
			// Store the full, unfiltered list of files
			rawCampaignFiles = fetchedData?.files || [];
			// Remember the campaign we just successfully fetched
			fetchedCampaignPath = campaignPath;

		} catch (err: any) {
			console.error('Error fetching details:', err);
			detailError = err.message || 'An unknown error occurred.';
		} finally {
			isLoadingDetails = false;
		}
	}
	async function handlePageChange(e: { page: number }) {
		const nextPage = e.page;
		const queryString = new URLSearchParams(page.url.searchParams.get('query') || '');
		queryString.set('page', String(nextPage));
		const location = `?${queryString.toString()}`;
		await goto(location, { invalidateAll: true });
	}

	// EFFECT: This runs ONLY when the active item changes.
	$effect(() => {
		if (rawCampaignFiles && activeResultItem) {
			// Run your existing filter function on the raw data
			const filteredList = filterCampaignFiles(
				rawCampaignFiles,
				activeResultItem.Product.value,
				activeResultItem.Peaks.value
			);
			// Update the final list that gets displayed
			detailedContent = filteredList;
		} else {
			// Clear the list if there's no data or no selection
			detailedContent = null;
		}
	});

	// EFFECT: Automatically select the first row when results change (e.g., on page load/navigation)
	$effect(() => {
		selectedRowIndex = results.length > 0 ? 0 : null;
	});

	// EFFECT: Fetch data whenever the active item changes.
	$effect(() => {
		if (activeResultItem) {
			fetchDetails(activeResultItem);
		}
	});

</script>

<div class="bg-tertiary-50-800 space-y-4 rounded p-4">
	<div class="table-wrap bg-tertiary-50-800 overflow-x-auto rounded-lg shadow">
		<table class="table caption-bottom">
			<thead>
				<tr>
					{#each headers as header}
						<th>{header}</th>
					{/each}
				</tr>
			</thead>
			<tbody class="[&>tr]:hover:bg-tertiary-100-900">
				{#each results as result, i}
					<tr
						onclick={() => (selectedRowIndex = i)}
						class="cursor-pointer"
						class:bg-tertiary-200-800={activeResultItem?.Product === result.Product}
					>
						{#each Object.entries(result) as [key, item]}
							{#if (item as DisplayValue<any>).display}
								<td>
									{#if Array.isArray((item as DisplayValue<any>).value)}
										<ul class="list-disc pl-5">
											{#each (item as DisplayValue<any>).value as v}
												<li>{v}</li>
											{/each}
										</ul>
									{:else}
										{(item as DisplayValue<any>).value}
									{/if}
								</td>
							{/if}
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<footer class="">
		<Pagination
			data={results}
			page={currentPage}
			onPageChange={(e) => handlePageChange(e)}
			{pageSize}
			siblingCount={4}
			count={resultsTotal}
			alternative
		/>
	</footer>
</div>
<Product
	isLoading={isLoadingDetails}
	error={detailError}
	filteredFiles={detailedContent ?? undefined}
	activeCampaign={activeResultItem?.Campaign.value}
	activeProduct={activeResultItem?.Product.value}
	activePeaks={activeResultItem?.Peaks.value}
	title={activeResultItem?.prefix}
/>
