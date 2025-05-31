import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { getCampaigns } from '$lib/utils/s3CampaignPrefixes';
import { listFilesInBucket } from '$lib/server/s3';

export const load: PageServerLoad = async ({ locals, url }) => {
	const prefix = url.searchParams.get('prefix') || 'batch/';
	console.log("***** s3", prefix);

    try {
        // Access the S3 utilities from locals
		const files = await listFilesInBucket(prefix);
		let campaignResults: CampaignResult[] = getCampaigns(files);

        return {
            results: campaignResults,
        };
    } catch (err) {
        console.error("Error using S3 locals:", err);
        throw error(500, "Failed to access S3 data");
    }
};


export const actions: Actions = {
	filter: async ({ request, url }) => {
		const formData = await request.formData();
		const prefix = formData.get('prefix') || 'batch/';

		// Create a URL object based on the current page's URL
		const targetUrl = new URL(url);
		targetUrl.searchParams.set('prefix', prefix);

		// TODO: this step should not be necessary
		const redirectUrl = targetUrl.toString().replace("https", "http");
		console.log("+++redirectUrl", redirectUrl);

		// Use status 303 (See Other) for the redirect status code
		throw redirect(303, redirectUrl);
	}
};
