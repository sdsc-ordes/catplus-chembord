import { addPresignedUrlsToFiles, listFilesInBucket } from '$lib/server/s3';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, request }) => {
    const path = `batch/${params.year}/${params.month}/${params.day}/${params.nr}/`
    const files = await listFilesInBucket(path);
    if (!files) {
		error(404, {
			message: 'Not found'
		});
	}
    const fileWithDownloadUrls = await addPresignedUrlsToFiles(files);
    return json({
        request: request.url,
        params: params,
        files: fileWithDownloadUrls,
    });
};
