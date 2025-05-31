import { S3Client } from '@aws-sdk/client-s3';
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME, AWS_S3_ENDPOINT, validateS3Config, hasS3Credentials } from '$lib/server/environment';
import type { ServerInit } from '@sveltejs/kit';

// init hook runs only once when the application starts
export const init: ServerInit = async () => {
	console.log("Init Hook");
	// Validate essential configuration
	try {
		validateS3Config();
	} catch (error) {
		console.error(`HOOKS: ${error.message}`);
		throw error;
	}

	// Log configuration status
	console.log("Init Hook: BASE_PATH is set to:", process.env.BASE_PATH || '/');
	console.log(`Init Hook: S3 Configuration - Region: ${AWS_REGION}, Bucket: ${S3_BUCKET_NAME}`);
	console.log(`Init Hook: AWS credentials ${hasS3Credentials() ? 'PRESENT' : 'MISSING'}`);

	// Log if using custom endpoint
	if (AWS_S3_ENDPOINT) {
		console.log(`Init Hook: Using custom S3 endpoint: ${AWS_S3_ENDPOINT}`);
	}
};

