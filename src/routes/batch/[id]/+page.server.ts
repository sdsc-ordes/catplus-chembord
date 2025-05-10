// Example in src/routes/some-route/+page.server.ts
import type { PageServerLoad } from '../../$types';
import { addPresignedUrlsToFiles } from '$lib/utils/addDownloadUrls';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const prefix = `${url.pathname.replace("/batch", "batch").replaceAll("-", "/")}/`;

    try {
        // Access the S3 utilities from locals
        const files = await locals.s3.listFiles(prefix);
		const fileWithDownloadUrls = await addPresignedUrlsToFiles(locals.s3.client, locals.s3.bucketName, files);

        return {
            files: fileWithDownloadUrls,
            prefix: prefix,
            bucket: locals.s3.bucketName,
        };
    } catch (err) {
        console.error("Error using S3 locals:", err);
        throw error(500, "Failed to access S3 data");
    }
};
