<script lang="ts">
	// The 'data' prop is automatically populated by SvelteKit
	// with the return value from the load function in +page.server.ts
	let { data } = $props();
	import { page } from '$app/state';

	import { groupFilesByCalculatedPrefix } from '$lib/utils/groupFiles';
    console.log(data);
</script>

<div class="container mx-auto p-4 font-sans md:p-8">
	<h1 class="mb-6 text-2xl font-bold text-gray-800">S3 Bucket Contents</h1>
	<p class="mb-4 text-gray-600">
		Search in Metadata
	</p>
	<div class="card preset-filled-surface-100-800 p-6">

		<form method="POST" action="?/filter" class="mx-auto w-full max-w-md space-y-4">
            <label class="flex items-center space-x-2">
                <input class="checkbox" type="checkbox" checked />
                <p>Option 1</p>
                </label>
                <label class="flex items-center space-x-2">
                <input class="checkbox" type="checkbox" />
                <p>Option 2</p>
                </label>
                <label class="flex items-center space-x-2">
                <input class="checkbox" type="checkbox" />
                <p>Option 3</p>
            </label>
			<div class="flex justify-start">
				<button type="submit" class="btn preset-filled-primary-500">
					<span>Search</span>
				</button>
			</div>
		</form>
    </div>
</div>