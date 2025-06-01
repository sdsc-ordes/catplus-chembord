import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getZipFileName } from '$lib/utils/zipFileName';
import { createZipStreamForPrefix } from '$lib/server/s3';

export const GET: RequestHandler = async ({ params, request }) => {
	const path = `batch/${params.year}/${params.month}/${params.day}/${params.nr}/`
	try {
		// Call the utility function from locals
		const zipStream = await createZipStreamForPrefix(path);

		// Generate a filename for the download
		const zipFileName = getZipFileName(path);

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
		console.error(`API Route: Error creating zip for prefix ${path}:`, err);
		// Handle errors thrown by createZipFile (e.g., "No files found")
		if (err.message?.includes('No files found')) {
			 throw error(404, err.message);
		}
		// Handle other potential errors
		throw error(500, `Failed to create zip archive: ${err.message || 'Unknown server error'}`);
	}
};
