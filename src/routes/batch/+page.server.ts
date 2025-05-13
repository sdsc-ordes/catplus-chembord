import type { PageServerLoad, Actions } from '../$types';
import { redirect } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { groupFilesByCalculatedPrefix } from '$lib/utils/s3groupFiles';
import type { S3FolderGroup } from '$lib/schema/s3';

export const load: PageServerLoad = async ({ locals, url }) => {
	const prefix = url.searchParams.get('prefix') || 'batch/';

    try {
        // Access the S3 utilities from locals
		const files = await locals.s3.listFiles(prefix);
		let foldersWithFiles: S3FolderGroup[] = groupFilesByCalculatedPrefix(files);

        return {
            foldersWithFiles: foldersWithFiles,
            prefixQueried: prefix,
            bucket: locals.s3.bucketName,
        };
    } catch (err) {
        console.error("Error using S3 locals:", err);
        throw error(500, "Failed to access S3 data");
    }
};


export const actions: Actions = {
	filter: async ({ request, url }) => {
		const formData = await request.formData();
		const prefix = formData.get('prefix') ||  'batch/';

		// --- Construct Redirect URL ---
		// Create a URL object based on the current page's URL
		const targetUrl = new URL(url);

		// Set the desired search parameters
		targetUrl.searchParams.set('prefix', prefix);

		// --- Redirect ---
		// Use status 303 (See Other) for POST -> GET redirect pattern
		throw redirect(303, targetUrl.toString());
	}
};
