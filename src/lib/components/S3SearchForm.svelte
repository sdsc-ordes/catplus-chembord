<script lang="ts">
	import Database from '@lucide/svelte/icons/database';
	let {
        prefix = "batch/"
    }: {
        prefix: string;
    } = $props();
</script>

<div class="bg-secondary-50 space-y-4 rounded p-4">
	<h1 class="mb-4 text-2xl font-bold text-gray-800">Campaign Data</h1>
	<form method="POST" action="?/filter" class="card space-y-4 p-4">
		<label class="label">
			<span>Filter Campaigns by Prefix:</span>
			<input name="prefix" class="input" type="string" value={prefix} required />
		</label>
		<div class="flex justify-start">
			<button type="submit" class="btn preset-filled-primary-500 w-full">
				<Database />Apply Path Filter
			</button>
		</div>
	</form>
</div>
