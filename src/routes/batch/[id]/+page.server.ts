// Example in src/routes/some-route/+page.server.ts
import type { PageServerLoad, Actions } from '../../$types';

import { redirect, fail } from '@sveltejs/kit';
import { addPresignedUrlsToFiles } from '$lib/utils/addDownloadUrls';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	//console.log(url);
	//const date = url.searchParams.get('date') || '2024-05-16';
	//console.log("date:", date);
	const prefix = `${url.pathname.replace("/batch", "batch").replaceAll("-", "/")}/`;
	//console.log("***prefix:", prefix);

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


export const actions: Actions = {
	// Use a named action matching your form's 'action' attribute
	// Or use 'default' if the form doesn't specify an action name
	filter: async ({ request, url }) => {
		const formData = await request.formData();
		const date = formData.get('date');
		//console.log("Form data:", formData);

		// --- Construct Redirect URL ---
		// Create a URL object based on the current page's URL
		const targetUrl = new URL(url);

		// Set the desired search parameters
		targetUrl.searchParams.set('date', date);

		//console.log("Target URL for redirect:", targetUrl.toString());

		// --- Redirect ---
		// Use status 303 (See Other) for POST -> GET redirect pattern
		throw redirect(303, targetUrl.toString());
	}
	// Add other actions if needed
};
