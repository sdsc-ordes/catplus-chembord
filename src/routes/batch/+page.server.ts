import type { PageServerLoad, Actions } from '../$types';

import { redirect } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { groupFilesByCalculatedPrefix } from './groupFiles';
import type { FolderGroup } from './types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const prefix = url.searchParams.get('prefix') || 'batch/';

	// Default is 0
	const indexParamValue = url.searchParams.get('index');
	const index = parseInt(indexParamValue, 10) || 0;

    console.log("Prefix:", prefix);
	console.log("Index:", index);
	const path="batch/2024/05/16/27/"
	const files = await locals.s3.listFiles(path);
	console.log("*** files", files)

    try {
        // Access the S3 utilities from locals
		const files = await locals.s3.listFiles(prefix);
		let foldersWithFiles: FolderGroup[] = groupFilesByCalculatedPrefix(files);

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
		console.log("============= form data", formData);
		const prefix = formData.get('prefix') ||  'batch/';

		// --- Construct Redirect URL ---
		// Create a URL object based on the current page's URL
		const targetUrl = new URL(url);

		// Set the desired search parameters
		targetUrl.searchParams.set('prefix', prefix);

		//console.log("Target URL for redirect:", targetUrl.toString());

		// --- Redirect ---
		// Use status 303 (See Other) for POST -> GET redirect pattern
		throw redirect(303, targetUrl.toString());
	}
};
