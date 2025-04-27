import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import type { PageServerLoad } from './search/$types';
import { error } from '@sveltejs/kit';

// Import necessary environment variables securely
// Ensure these are set in your .env file or deployment environment
import { AWS_REGION, S3_BUCKET_NAME } from "$env/static/private";
// AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) should ideally be
// sourced automatically by the SDK from environment variables or IAM roles.

// Basic check for essential configuration
if (!AWS_REGION || !S3_BUCKET_NAME) {
    console.error("Missing required S3 configuration (AWS_REGION or S3_BUCKET_NAME)");
    // Throwing an error during module load might stop the server,
    // consider handling this more gracefully depending on your setup.
    throw new Error("Server configuration error: S3 settings missing.");
}

// Instantiate the S3 Client
// Ensure your server environment has AWS credentials configured
// (e.g., via environment variables, ~/.aws/credentials, or IAM role)
const s3Client = new S3Client({
    region: AWS_REGION,
});

// Define the PageServerLoad function to fetch data before the page loads
export const load: PageServerLoad = async ({ params }) => {
    console.log(`Fetching objects from bucket: ${S3_BUCKET_NAME}`);

    // Optional: You could use route parameters to define a prefix (folder) to list
    // const prefix = params.prefix ? `${params.prefix}/` : '';
    const prefix = ''; // List from the root, adjust as needed

    const command = new ListObjectsV2Command({
        Bucket: S3_BUCKET_NAME,
        Prefix: prefix,
        // Delimiter: '/', // Use if you only want top-level items in the prefix
    });

    try {
        const response = await s3Client.send(command);

        // Extract relevant data from the response
        // response.Contents is an array of objects in the bucket/prefix
        // response.CommonPrefixes lists "subfolders" if Delimiter is used
        const objects = response.Contents?.map(item => ({
            key: item.Key, // The full path/name of the object
            size: item.Size, // Size in bytes
            lastModified: item.LastModified, // Date object
        })) ?? []; // Provide an empty array if Contents is undefined

        console.log(`Found ${objects.length} objects.`);
        console.log(objects);

        // Return the fetched data - this becomes the 'data' prop in +page.svelte
        return {
            bucket: S3_BUCKET_NAME,
            prefix: prefix,
            objects: objects, // Pass the array of object details
        };

    } catch (err: any) {
        console.error("Error listing S3 objects:", err);

        // Handle specific AWS errors if needed
        if (err.name === 'NoSuchBucket') {
            throw error(404, `Bucket not found: ${S3_BUCKET_NAME}`);
        } else if (err.name === 'AccessDenied') {
             throw error(403, `Access denied listing bucket: ${S3_BUCKET_NAME}`);
        } else {
            // Throw a generic server error for other issues
            throw error(500, `Failed to list objects in bucket: ${err.message || 'Unknown error'}`);
        }
    }
};
