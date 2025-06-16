import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit';
import { type CampaignResult, prefixesToCampaignResults } from '$lib/utils/groupCampaigns';
import { findLeafPrefixes } from '$lib/server/s3';
import { logger } from '$lib/server/logger';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
    try {
        const prefix = url.searchParams.get('prefix') || 'batch/';

        const { prefixes, count } = await findLeafPrefixes(prefix, 5);
        logger.info({prefixes, count}, `got campaign prefixes for start prefix ${prefix}`)

        // transform the result into object
        const campaignResults: CampaignResult[] = prefixesToCampaignResults(prefixes)
        logger.debug({campaignResults}, "campaignResults")
        return {
            results: campaignResults,
            resultTotal: count,
        };
    } catch (err: any) {
        throw new Error(err)
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
