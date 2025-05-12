// Example in src/routes/some-route/+page.server.ts
import { addPresignedUrlsToFiles } from '$lib/utils/addDownloadUrls';
import type { RequestHandler } from '../../../$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, locals }) => {
    console.log("============ in api function")
    console.log(params)
    const path = `batch/${params.year}/${params.month}/${params.day}/${params.nr}/`
    console.log(path)
    const files = await locals.s3.listFiles(path);
    const fileWithDownloadUrls = await addPresignedUrlsToFiles(locals.s3.client, locals.s3.bucketName, files);
    console.log(fileWithDownloadUrls);
    return json({
        files: fileWithDownloadUrls,
    });
};
