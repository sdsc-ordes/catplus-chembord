<script lang="ts">
	import Product from '$lib/components/Product.svelte';
	import { publicConfig } from '$lib/config';
	import type { S3FileInfo } from '$lib/server/s3';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	let currentPage = $derived(page.url.searchParams.get('page') || 1);

	// get props from data loader
	let { results, resultsTotal, tableHeaders } = $props();

	const headers = Object.values(tableHeaders);

	// Pagination of Campaigns
	let pageSize = publicConfig.PUBLIC_RESULTS_PER_PAGE;

	// State for the fetched detailed data for the main content
	let detailedContent = $state<S3FileInfo[] | null>(null);
	let isLoadingDetails = $state(false);
	let detailError = $state<string | null>(null);
	//let activeResultItem = $state<ResultItemType | null>(null);
	let selectedRowIndex = $state<number | null>(null);
	const activeResultItem = $derived(selectedRowIndex === null ? null : results[selectedRowIndex]);

	async function fetchDetails(activeResultItem: ResultItemType) {
		isLoadingDetails = true;
		detailError = null;
		detailedContent = null;
		const campaignPath = activeResultItem.Campaign.value;
		console.log('Fetching details for campaign:', campaignPath);
		console.log('Fetching details for product:', activeResultItem.Product.value);
		console.log('Fetching details for peaks:', activeResultItem.Peaks.value);
		try {
			// Adjust the URL to your actual API endpoint structure
			const response = await fetch(`${base}/api/${campaignPath}`);
			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ message: `HTTP error! status: ${response.status}` }));
				throw new Error(errorData.message || `Failed to fetch details. Status: ${response.status}`);
			}
			const fetchedDetails: S3FileInfo[] = await response.json();
			console.log('API Response Structure:', fetchedDetails);
			const files = fetchedDetails?.files || [];
			console.log('Files:', files);
			let filteredContent = files.filter((file) =>
				file.Key.includes(activeResultItem.Product.value)
			);
			console.log('Filtered Content:', filteredContent);
			detailedContent = filteredContent;
			const filteredList = filterCampaignFiles(
				files,
				activeResultItem.Product.value,
				activeResultItem.Peaks.value
			);
			console.log('Filtered List:', filteredList);
			detailedContent = filteredList;
			console.log('Fetched details:', detailedContent);
		} catch (err: any) {
			console.error('Error fetching details:', err);
			detailError = err.message || 'An unknown error occurred.';
		} finally {
			isLoadingDetails = false;
		}
	}

	/**
	 * Filters a list of files based on specific product and peak criteria.
	 * @param {Array<{Key: string}>} files - The array of file objects, each with a 'Key' property.
	 * @param {string | null} activeProduct - The product prefix for filtering 'Agilent' files.
	 * @param {Array<string> | null} activePeaks - An array of peak prefixes for filtering 'IV' or 'MNR' files.
	 * @returns {Array<{Key: string}>} The new, filtered array of files.
	 */
	function filterCampaignFiles(files: string[], activeProduct: string | null, activePeaks: string[] | null) {
		// If there are no files to filter, return an empty array.
		if (!files || files.length === 0) {
			return [];
		}
		console.log('activeProduct:', activeProduct);
		console.log('activePeaks:', activePeaks);

		return files.filter((file) => {
			console.log('activeProduct inside:', activeProduct);
			const fileName = file.name;

			// Rule 1: Handle 'Agilent' files
			if (fileName.includes('Agilent')) {
				if (activeProduct && fileName.startsWith(activeProduct)) {
					// Keep only if activeProduct exists and the file name starts with it.
					console.log('Keeping Agilent file:', fileName);
					return true;
				} else {
					return false;
				}
			}

			// Rule 2: Handle 'IR' or 'MNR' files
			if (
				fileName.includes('IR') ||
				fileName.includes('NMR') ||
				fileName.includes('UV') ||
				fileName.includes('Bravo')
			) {
				// Keep only if activePeaks exists and the file name starts with one of them.
				return (
					Array.isArray(activePeaks) &&
					activePeaks.length > 0 &&
					activePeaks.some((peak) => fileName.startsWith(peak))
				);
			}

			// Rule 3: If none of the above, keep all other files.
			return true;
		});
	}

	async function handlePageChange(e) {
		const nextPage = e.page;
		const queryString = new URLSearchParams(page.url.searchParams.get('query') || '');
		queryString.set('page', nextPage);
		const location = `?${queryString.toString()}`;
		console.log('Navigating to:', location);
		await goto(location, { invalidateAll: true });
	}

	// EFFECT: This runs ONLY when the active item changes.
	$effect(() => {
		if (activeResultItem) {
			// Fetch details for the newly active item
			fetchDetails(activeResultItem);
			console.log('Fetched Active Result Item:', activeResultItem);
		} else if (selectedRowIndex === null) {
		} else {
			// Clear details if no item is selected
			detailedContent = null;
			detailError = null;
		}
	});

	// EFFECT: Automatically select the first row when results change (e.g., on page load/navigation)
	$effect(() => {
		selectedRowIndex = results.length > 0 ? 0 : null;
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
						{#each Object.entries(result) as [key, item]: [string, unknown]}
							{#if item.display}
								<td>
									{#if Array.isArray(item.value)}
										<ul class="list-disc pl-5">
											{#each item.value as v}
												<li>{v}</li>
											{/each}
										</ul>
									{:else}
										{item.value}
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
			{currentPage}
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
	campaignFiles={detailedContent}
	activeCampaign={activeResultItem?.Campaign.value}
	activeProduct={activeResultItem?.Product.value}
	activePeaks={activeResultItem?.Peaks.value}
	title={activeResultItem?.prefix}
/>
