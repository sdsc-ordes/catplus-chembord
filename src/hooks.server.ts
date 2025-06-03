import { AWS_REGION, S3_BUCKET_NAME, AWS_S3_ENDPOINT, QLEVER_URL, validateS3Config, validateQleverUrl, hasS3Credentials } from '$lib/server/environment';
import type { ServerInit } from '@sveltejs/kit';
import type { Handle, HandleServerError, HandleClientError, HandleFetch } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { base } from '$app/paths';

// init hook runs only once when the application starts
export const init: ServerInit = async () => {
	console.log("Init Hook");
	// Validate essential configuration
	try {
    validateQleverUrl();
		validateS3Config();
	} catch (error: any) {
		console.error(`HOOKS: ${error.message}`);
		throw error;
	}

	// Log configuration status
	console.log(`Init Hook: QLEVER_URL is set to: ${QLEVER_URL}`);
	console.log("Init Hook: BASE_PATH is set to:", base);
	console.log(`Init Hook: S3 Configuration - Region: ${AWS_REGION}, Bucket: ${S3_BUCKET_NAME}`);
	console.log(`Init Hook: AWS credentials ${hasS3Credentials() ? 'PRESENT' : 'MISSING'}`);

	// Log if using custom endpoint
	if (AWS_S3_ENDPOINT) {
		console.log(`Init Hook: Using custom S3 endpoint: ${AWS_S3_ENDPOINT}`);
	}
};

// Logs every request
export const handle: Handle = async ({ event, resolve }) => {
	// currently this is only logging requests
	console.log("HANDLE request", event.request.url)
	const response = await resolve(event);
	return response;
};
