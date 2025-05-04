import type { PageServerLoad, Actions } from '../$types';

import { redirect, fail } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const prefix = url.searchParams.get('prefix') || 'batch/';
    //	console.log("Prefix:", prefix);

    try {
        // Access the S3 utilities from locals
        const folders = await locals.s3.listFolders(prefix);
		const files = await locals.s3.listFiles(prefix);

        return {
			files: files,
            folders: folders,
            prefixQueried: prefix,
            bucket: locals.s3.bucketName,
        };
    } catch (err) {
        console.error("Error using S3 locals:", err);
        throw error(500, "Failed to access S3 data");
    }
};


export const actions: Actions = {
	// Use a named action matching your form's 'action' attribute
	// Or use 'default' if the form doesn't specify an action name
	filter: async ({ request, url }) => {
		const formData = await request.formData();
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
	// Add other actions if needed
};
