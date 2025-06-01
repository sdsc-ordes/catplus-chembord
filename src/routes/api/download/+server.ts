import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getZipFileName } from '$lib/utils/zipFileName';
import { createZipStreamForPrefix } from '$lib/server/s3';

export const GET: RequestHandler = async ({ url, locals }) => {
	const prefix = url.searchParams.get('prefix');
	console.log(prefix);
	console.log(url);

	if (!prefix || typeof prefix !== 'string') {
		throw error(400, 'Missing or invalid "prefix" query parameter');
	}

	try {
		// Call the utility function from locals
		const zipStream = await createZipStreamForPrefix(prefix);

		// Generate a filename for the download
		const zipFileName = getZipFileName(prefix);

		// Return the stream directly in the Response
		return new Response(zipStream as ReadableStream<any>, {
			status: 200,
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="${zipFileName}"`,
				'Cache-Control': 'private, no-cache, no-store, must-revalidate',
			},
		});

	} catch (err: any) {
		console.error(`API Route: Error creating zip for prefix ${prefix}:`, err);
		// Handle errors thrown by createZipFile (e.g., "No files found")
		if (err.message?.includes('No files found')) {
			 throw error(404, err.message);
		}
		// Handle other potential errors
		throw error(500, `Failed to create zip archive: ${err.message || 'Unknown server error'}`);
	}
};
