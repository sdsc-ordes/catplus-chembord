import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Using Node adapter for Kubernetes deployment
		// See https://kit.svelte.dev/docs/adapter-node for more information
		adapter: adapter({
			// Default options
			env: {
				host: '0.0.0.0',
				port: '3000'
			}
		})
	}
};

export default config;
