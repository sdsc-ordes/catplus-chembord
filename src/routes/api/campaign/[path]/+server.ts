// Example in src/routes/some-route/+page.server.ts
import { addPresignedUrlsToFiles } from '$lib/utils/addDownloadUrls';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
    const path = parseInt(params.path, 10);

    if (isNaN(path)) {
        return json(
            {
                error: 'Invalid path parameter'
            },
            { status: 400 }
        );
    }
    const files = await locals.s3.listFiles(path);
    const fileWithDownloadUrls = await addPresignedUrlsToFiles(locals.s3.client, locals.s3.bucketName, files);

    return json({
        files: fileWithDownloadUrls,
    });
};
