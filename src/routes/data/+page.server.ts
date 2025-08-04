import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit';
import { type CampaignResult, prefixesToCampaignResults } from '$lib/utils/groupCampaigns';
import { findLeafPrefixes } from '$lib/server/s3';
import { logger } from '$lib/server/logger';

import { z } from 'zod';
import { fail } from '@sveltejs/kit';

// Define the validation schema with Zod
const filterSchema = z.object({
    year: z.string()
        .regex(/^\d{4}$/, { message: "Year must be a 4-digit number" })
        .optional()
        .or(z.literal('')), // Allow empty string

    month: z.preprocess(
        // If the input is an empty string, convert it to `undefined`.
        // Otherwise, pass it through unchanged.
        (val) => (val === "" ? undefined : val),
        // Now, validate the processed value.
        z.coerce.number({ invalid_type_error: "Month must be a number" })
            .int()
            .min(1, { message: "Month must be between 1 and 12" })
            .max(12, { message: "Month must be between 1 and 12" })
            .optional()
    ),

    day: z.preprocess(
        // Same preprocessing for the day field.
        (val) => (val === "" ? undefined : val),
        // Validate the processed day value.
        z.coerce.number({ invalid_type_error: "Day must be a number" })
            .int()
            .min(1, { message: "Day must be between 1 and 31" })
            .max(31, { message: "Day must be between 1 and 31" })
            .optional()
    ),

    number: z.string()
        .regex(/^\d{1,2}$/, { message: "Number must be a 1 or 2-digit number" })
        .optional()
        .or(z.literal('')),
})
// Your dependency rules are still correct and important!
.superRefine((data, ctx) => {
    if (data.month && !data.year) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['year'],
            message: 'Year is required to specify a month',
        });
    }
    if (data.day && !data.month) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['month'],
            message: 'Month is required to specify a day',
        });
    }
    if (data.number && !data.day) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['day'],
            message: 'Day is required to specify a number',
        });
    }
});

export const load: PageServerLoad = async ({ locals, url }) => {
    try {
        const year = url.searchParams.get('year') || undefined;
        const rawMonth = url.searchParams.get('month') || undefined;
        const rawDay = url.searchParams.get('day') || undefined;
        const number = url.searchParams.get('number') || undefined;
        const month = rawMonth ? rawMonth.padStart(2, '0') : undefined;
        const day = rawDay ? rawDay.padStart(2, '0') : undefined;
        const pathParts = ['batch', year, month, day, number].filter(part => part);
        const prefix = pathParts.join('/');
        logger.debug({prefix}, `Search campaigns with prefix ${prefix}`)

        const { prefixes, count } = await findLeafPrefixes(prefix, 5);
        logger.debug({prefixes, count}, `got campaign prefixes for start prefix ${prefix}`)

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

export const actions = {
    filter: async ({ request, url }) => {
        const formData = await request.formData();
        const data = Object.fromEntries(formData);

        const result = filterSchema.safeParse(data);

        if (!result.success) {
            // The `fail` function sends back a 400 status code
            // and the validation errors, along with the original data.
            return fail(400, {
                data: data,
                errors: result.error.flatten().fieldErrors,
            });
        }

        logger.debug('Validation successful! Applying filter with:', result.data);

        const targetUrl = new URL(url.origin + url.pathname)
        logger.debug(result.data, 'result.data');

        for (const [key, value] of Object.entries(result.data)) {
            if (value) {
                targetUrl.searchParams.set(key, value as string);
            }
        }
        logger.debug(`Redirecting to ${targetUrl}`);

        // Use status 303
		throw redirect(303, targetUrl);
    }
};
