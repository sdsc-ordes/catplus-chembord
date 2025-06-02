import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { groupFilesByCampaign, type CampaignResult } from '$lib/utils/groupCampaigns';
import { listFilesInBucket, type S3FileInfo } from '$lib/server/s3';


export const load: PageServerLoad = async ({ locals, url }) => {
	const prefix = url.searchParams.get('prefix') || 'batch/';

    try {
        // Access the S3 utilities from locals
		const files: S3FileInfo[] = await listFilesInBucket(prefix);
		let campaignResults: CampaignResult[] = groupFilesByCampaign(files);

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
		const targetUrl = new URL(url.origin + url.pathname);
		targetUrl.searchParams.set('prefix', prefix);

		// Use status 303 (See Other) for the redirect status code
		throw redirect(303, targetUrl);
	}
};
