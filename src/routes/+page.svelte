<script lang="ts">
	// The 'data' prop is automatically populated by SvelteKit
	// with the return value from the load function in +page.server.ts
	export let data: {
		bucket: string;
		prefix?: string;
		objects?: Array<{
			key: string;
			size: number;
			lastModified: Date;
		}>;
	};
	console.log(data)

	// Helper function to format bytes into KB, MB, etc.
	function formatBytes(bytes: number | undefined | null, decimals = 2): string {
		if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
	}

	// Helper function to format date (optional)
	function formatDate(date: Date | undefined | null): string {
		if (!date) return 'N/A';
		return date.toLocaleString(); // Use browser's locale formatting
	}
</script>

<div class="container mx-auto p-4 font-sans md:p-8">
	<h1 class="mb-6 text-3xl font-bold text-gray-800">S3 Bucket Contents</h1>
	<p class="mb-4 text-gray-600">
		Listing objects in bucket: <code class="rounded bg-gray-200 px-2 py-1 text-sm"
			>{data.bucket}</code
		>
		{#if data.prefix}
			<br />Prefix: <code class="rounded bg-gray-200 px-2 py-1 text-sm">{data.prefix}</code>
		{/if}
	</p>

	{#if data.objects && data.objects.length > 0}
		<div class="overflow-x-auto rounded-lg bg-white shadow">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-100">
					<tr>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-600 uppercase"
						>
							Object Key (Name)
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-600 uppercase"
						>
							Size
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-600 uppercase"
						>
							Last Modified
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each data.objects as object (object.key)}
						<tr class="transition-colors duration-150 hover:bg-gray-50">
							<td class="px-6 py-4 text-sm font-medium break-all whitespace-nowrap text-gray-900">
								{object.key}
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
								{formatBytes(object.size)}
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
								{formatDate(object.lastModified)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else if data.objects}
		<div
			class="relative rounded border border-blue-400 bg-blue-100 px-4 py-3 text-blue-700"
			role="alert"
		>
			<strong class="font-bold">Info:</strong>
			<span class="block sm:inline"> No objects found in this bucket/prefix.</span>
		</div>
	{:else}
		<div
			class="relative rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-yellow-700"
			role="alert"
		>
			<strong class="font-bold">Loading:</strong>
			<span class="block sm:inline"> Fetching object list...</span>
		</div>
	{/if}
</div>
