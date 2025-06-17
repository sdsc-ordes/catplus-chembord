<script lang="ts">
	import { page } from '$app/state';
	import { AlertTriangle, Home } from '@lucide/svelte';;

	// Extract error details safely using optional chaining
	const status = page.status;
	const message = page.error?.message;
	const errorId = page.error?.errorId;
</script>

<div class="flex min-h-screen flex-col items-center justify-center">
	<!-- The main error card, styled with Skeleton and Tailwind classes -->
	<div
		class="card w-full max-w-lg space-y-4 rounded-lg p-8 text-center shadow-xl variant-ghost-surface"
	>
		<header class="flex flex-col items-center space-y-4">
			<!-- A prominent icon to grab attention -->
			<AlertTriangle class="text-error-500" size={64} stroke-width={1.5} />
			<!-- Display the HTTP status code in a large font -->
			<h1 class="h1 text-6xl font-bold">{status}</h1>
		</header>

		<div class="space-y-2">
			<!-- Display the user-friendly error message -->
			<p class="text-lg font-medium text-surface-700 dark:text-surface-300">
				{message || 'An unexpected error occurred.'}
			</p>

			<!-- Optionally, show an error ID for support tickets -->
			{#if errorId}
				<p class="text-sm text-surface-500">
					Error ID: {errorId}
				</p>
			{/if}
		</div>

		<hr class="!my-6" />

		<!-- A footer with a clear call to action -->
		<footer class="flex flex-col items-center">
			<a href="/" class="btn preset-filled-primary-500">
				<Home class="mr-2" size={20} />
				<span>Go to Homepage</span>
			</a>
		</footer>
	</div>
</div>
