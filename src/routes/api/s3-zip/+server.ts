import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getZipFileName } from '$lib/utils/zipFileName';

export const GET: RequestHandler = async ({ url, locals }) => {
	const prefixToZip = url.searchParams.get('prefix');

	if (!prefixToZip || typeof prefixToZip !== 'string') {
		throw error(400, 'Missing or invalid "prefix" query parameter');
	}

	//console.log(`API Route: Requesting zip stream for prefix: ${prefixToZip}`);

	try {
		// Call the utility function from locals
		const zipStream = await locals.s3.createZipFile(prefixToZip);

		// Generate a filename for the download
		const zipFileName = getZipFileName(prefixToZip);

		// Return the stream directly in the Response
		return new Response(zipStream as ReadableStream<any>, { // Cast stream type if necessary for Response constructor
			status: 200,
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="${zipFileName}"`,
				'Cache-Control': 'private, no-cache, no-store, must-revalidate',
			},
		});

	} catch (err: any) {
		console.error(`API Route: Error creating zip for prefix ${prefixToZip}:`, err);
		// Handle errors thrown by createZipFile (e.g., "No files found")
		if (err.message?.includes('No files found')) {
			 throw error(404, err.message);
		}
		// Handle other potential errors
		throw error(500, `Failed to create zip archive: ${err.message || 'Unknown server error'}`);
	}
};
