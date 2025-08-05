import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getZipFileName } from '$lib/utils/zipFileName';
import { createZipStreamFromKeys, listFilesInBucket } from '$lib/server/s3';

export const GET: RequestHandler = async ({ params, request }) => {
	const path = `batch/${params.year}/${params.month}/${params.day}/${params.nr}/`
	const url = new URL(request.url);
	const product = url.searchParams.get('product') || null;
	const peaks = url.searchParams.get('peaks')?.split(',') || [];
	console.log(url.searchParams.get('product'));
	console.log(url.searchParams.get('peaks'));
	try {
		// Call the utility function from local
		const normalizedPrefix = path.endsWith('/') ? path : `${path}/`;
		//const zipStream = await createZipStreamForPrefix(normalizedPrefix);
		const objectsToZip = await listFilesInBucket(normalizedPrefix);

		 const zipStream = await createZipStreamFromKeys(
            objectsToZip.map(obj => obj.Key!),
            normalizedPrefix
        );

		// Generate a filename for the download
		const zipFileName = getZipFileName(path, product);

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
