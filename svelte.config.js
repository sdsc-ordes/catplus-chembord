import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	//preprocess: vitePreprocess(),
	preprocess: [
		vitePreprocess(),
	],

	kit: {
		// Using Node adapter for Kubernetes deployment
		// See https://kit.svelte.dev/docs/adapter-node for more information
		adapter: adapter({
			// Default options
			env: {
				host: '0.0.0.0',
				port: '3000'
			}
		}),
		// Support for base path when deployed behind reverse proxy
		// Set BASE_PATH environment variable (e.g., '/chemboard') for path-based routing
		paths: {
			base: process.env.BASE_PATH || '/chemboard',
			// assets path omitted - will use same path as base for relative assets
		},
		csrf: {
			// TODO: remove this: temporary to prevent form submit errors
			checkOrigin: false // Use with caution and understand the security implications
		}
	}
};

export default config;
