import type { QleverRawResult } from '$lib/config/sparqlQueries'

// Mapped Qlever result with prefix instead of content URL
interface MappedQleverResult {
    prefix: string;
    campaignName: string;
    reactionName: string;
    reactionType: string;
    chemicals: string;
}

// Consolidated Qlever display result
interface ConsolidatedQleverResult {
    prefix: string;
    campaignName: string | string[];
    reactionName: string | string[];
    reactionType: string | string[];
    chemicals: string | string[];
}


// transform content URL to s3 prefix, so that search result can be linked
/**
   * transform content URL to s3 prefix, so that search result can be linked
   * @param cu - Campaign contentURL
   * @returns S3 prefix
   * @example
   */
export function s3LinkToPrefix(cu: string): string {
    let s3Path = cu.replace('file:///data/', '');
    const lastSlashIndex = s3Path.lastIndexOf('/');
    const prefix = s3Path.substring(0, lastSlashIndex + 1);
    return prefix;
}

/**
   * Maps an array of Qlever results to their display version
   * @param results - An array of source user objects.
   * @returns An array of transformed display result objects.
   */
export function mapQleverResults(results: QleverRawResult[]): MappedQleverResult[] {
    if (!Array.isArray(results)) {
        console.error('Input must be an array.');
        return [];
    }
    return results.map((result: QleverRawResult): MappedQleverResult => {
        const mappedResult: MappedQleverResult = {
            prefix: s3LinkToPrefix(result.cu),
            campaignName: result.cp,
            reactionName: result.rn,
            reactionType: result.rt,
            chemicals: [result.cn, result.ca, result.sm].join(","),
        };
        return mappedResult;
    });
}

/**
 * Takes raw Qlever results, maps them, groups them by prefix,
 * and then consolidates properties within each group.
 * - If a property is the same for all items in a group, it remains a single string.
 * - If a property differs among items in a group, it becomes an array of unique string values.
 *
 * @param rawResults - An array of QleverRawResult objects.
 * @returns A Record where keys are prefixes (string) and values are ConsolidatedQleverResult objects.
 */
export function groupMappedQleverResultsByPrefix(
    rawResults: QleverRawResult[]
): ConsolidatedQleverResult[] {
    // Transform the raw results into the display format
    const mappedResults: MappedQleverResult[] = mapQleverResults(rawResults);

    // Group the mapped results by the 'prefix' property
    const groupedByPrefix = mappedResults.reduce<Record<string, MappedQleverResult[]>>((accumulator, currentItem) => {
        const groupKey = currentItem.prefix;
        if (!accumulator[groupKey]) {
            accumulator[groupKey] = [];
        }
        accumulator[groupKey].push(currentItem);
        return accumulator;
    }, {});

    const consolidatedOutput: Record<string, ConsolidatedQleverResult> = {};

    for (const prefixKey in groupedByPrefix) {
        if (Object.prototype.hasOwnProperty.call(groupedByPrefix, prefixKey)) {
            const itemsInGroup: MappedQleverResult[] = groupedByPrefix[prefixKey];

            if (itemsInGroup.length === 0) {
                continue;
            }

            // Initialize the consolidated item.
            const consolidatedItemBase: any = { prefix: prefixKey };

            const firstItem = itemsInGroup[0];
            // These are the keys we want to process for consolidation (excluding 'prefix')
            const propertyKeys = Object.keys(firstItem).filter(
                k => k !== 'prefix'
            ) as Array<keyof Omit<MappedQleverResult, 'prefix'>>;

            for (const propKey of propertyKeys) {
                // Collect all values for the current property from all items in the group
                const valuesForKey = itemsInGroup.map(item => item[propKey]);

                // Find the unique values for this property
                const uniqueValues = Array.from(new Set(valuesForKey));

                if (uniqueValues.length === 1) {
                    // If all values are the same, store the single value
                    consolidatedItemBase[propKey] = uniqueValues[0];
                } else {
                    // If values differ, join the unique differing values with " | "
                    consolidatedItemBase[propKey] = uniqueValues;
                }
            }
            consolidatedOutput[prefixKey] = consolidatedItemBase as ConsolidatedQleverResult;
        }
    }
    return Object.values(consolidatedOutput);
}
