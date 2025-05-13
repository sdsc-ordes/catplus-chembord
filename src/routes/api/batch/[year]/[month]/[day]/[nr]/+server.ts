// Example in src/routes/some-route/+page.server.ts
import { addPresignedUrlsToFiles } from '$lib/utils/addDownloadUrls';
import type { RequestHandler } from '../../../$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, locals }) => {
    const path = `batch/${params.year}/${params.month}/${params.day}/${params.nr}/`
    const files = await locals.s3.listFiles(path);
    const fileWithDownloadUrls = await addPresignedUrlsToFiles(locals.s3.client, locals.s3.bucketName, files);
    return json({
        files: fileWithDownloadUrls,
    });
};
