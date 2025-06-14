import type { QleverRawResult, FilterCategory } from '$lib/config'

// Mapped Qlever result with prefix instead of content URL
interface MappedQleverResult {
    prefix: string;
    campaignName: string;
    reaction: string;
    chemicals: string;
}

// Consolidated Qlever display result
interface ConsolidatedQleverResult {
    prefix: string;
    campaignName: string | string[];
    reaction: string | string[];
    chemicals: string | string[];
}


// transform content URL to s3 prefix, so that search result can be linked
/**
   * transform content URL to s3 prefix, so that search result can be linked
   * @param cu - Campaign contentURL
   * @returns S3 prefix
   * @example
   */
export function s3LinkToPrefix(contentUrl: string): string {
    let s3Path = contentUrl.replace('file:///data/', '');
    const lastSlashIndex = s3Path.lastIndexOf('/');
    const prefix = s3Path.substring(0, lastSlashIndex + 1);
    return prefix;
}

/**
 * Maps an array of Qlever results to their display version, dynamically
 * including only the columns specified.
 * @param results - An array of source user objects.
 * @param columns - An array of FilterCategory keys to include in the result.
 * @returns An array of transformed display result objects.
 */
export function mapQleverResults(
    results: QleverRawResult[],
    columns: FilterCategory[]
): MappedQleverResult[] {
    if (!Array.isArray(results)) {
        console.error('Input must be an array.');
        return [];
    }

    // For efficient lookups, convert the columns array to a Set.
    const columnsSet = new Set(columns);

    return results.map((result: QleverRawResult): MappedQleverResult => {
        // Start building the result. 'prefix' seems to be a required base property.
        // We use Partial<> here because properties will be added conditionally.
        const mappedResult: Partial<MappedQleverResult> = {
            prefix: s3LinkToPrefix(result.contentUrl)
        };

        // --- Handle direct 1-to-1 mappings ---
        if (columnsSet.has('CAMPAIGN_NAME')) {
            mappedResult.campaignName = result.campaignName;
        }

        // --- Handle the composite 'reaction' field ---
        const reactionParts: string[] = [];

        if (columnsSet.has('REACTION_TYPE')) {
            reactionParts.push(result.reactionType);
        }
        if (columnsSet.has('REACTION_NAME')) {
            reactionParts.push(result.reactionName);
        }

        // --- Handle the composite 'chemicals' field ---
        const chemicalParts: string[] = [];

        if (columnsSet.has('CHEMICAL_NAME')) {
            chemicalParts.push(result.chemicalName);
        }
        if (columnsSet.has('CAS')) {
            chemicalParts.push(result.casNumber);
        }
        if (columnsSet.has('SMILES')) {
            chemicalParts.push(result.smiles);
        }

        // Only add the 'reaction' property if any of its constituent parts were requested.
        if (reactionParts.length > 0) {
            // .filter(Boolean) gracefully handles any null/undefined/empty string values
            mappedResult.reaction = reactionParts.filter(Boolean).join(', ');
        }


        // Only add the 'chemicals' property if any of its constituent parts were requested.
        if (chemicalParts.length > 0) {
            // .filter(Boolean) gracefully handles any null/undefined/empty string values
            mappedResult.chemicals = chemicalParts.filter(Boolean).join(', ');
        }

        // Cast the dynamically built object to the final MappedQleverResult type.
        return mappedResult as MappedQleverResult;
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
    rawResults: QleverRawResult[], resultColumns: FilterCategory[]
): ConsolidatedQleverResult[] {
    // Transform the raw results into the display format
    const mappedResults: MappedQleverResult[] = mapQleverResults(rawResults, resultColumns);

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

/**
 * Creates a dynamic set of table headers, combining reaction and chemical
 * columns into single, descriptive headers while preserving the input order.
 *
 * @param {FilterCategory[]} resultColumns - The columns to display, in the desired order.
 * @param {Record<FilterCategory, string>} allColumnHeaders - All possible headers.
 * @returns {Record<string, string>} - The final headers for the table, correctly ordered.
 */
export function createDynamicTableHeaders(
    resultColumns: FilterCategory[],
    allColumnHeaders: Record<FilterCategory, string>
): Record<string, string> {
    const finalHeaders: Record<string, string> = {};
    const columnsSet = new Set(resultColumns); // For efficient 'has' checks

    // --- Define the groups ---
    const reactionGroupMap = {
        REACTION_TYPE: "Type",
        REACTION_NAME: "Name",
    };
    const chemicalGroupMap = {
        CHEMICAL_NAME: "Name",
        CAS: "CAS",
        SMILES: "Smiles",
    };

    const reactionKeys = new Set(Object.keys(reactionGroupMap) as FilterCategory[]);
    const chemicalKeys = new Set(Object.keys(chemicalGroupMap) as FilterCategory[]);

    // --- Keep track of which combined headers we have already added ---
    let reactionGroupAdded = false;
    let chemicalGroupAdded = false;

    // --- Iterate through the resultColumns to maintain the desired order ---
    for (const columnKey of resultColumns) {
        // Is it a reaction key, and have we NOT added the combined header yet?
        if (reactionKeys.has(columnKey) && !reactionGroupAdded) {
            const presentParts = Object.entries(reactionGroupMap)
                .filter(([key]) => columnsSet.has(key as FilterCategory))
                .map(([, value]) => value);

            if (presentParts.length > 0) {
                finalHeaders.REACTION_GROUP = `Reaction (${presentParts.join(", ")})`;
                reactionGroupAdded = true; // Mark as added so we don't add it again
            }
        }
        // Is it a chemical key, and have we NOT added the combined header yet?
        else if (chemicalKeys.has(columnKey) && !chemicalGroupAdded) {
            const presentParts = Object.entries(chemicalGroupMap)
                .filter(([key]) => columnsSet.has(key as FilterCategory))
                .map(([, value]) => value);

            if (presentParts.length > 0) {
                finalHeaders.CHEMICAL_GROUP = `Chemical (${presentParts.join(", ")})`;
                chemicalGroupAdded = true; // Mark as added
            }
        }
        // Is it a standalone column?
        else if (!reactionKeys.has(columnKey) && !chemicalKeys.has(columnKey)) {
            finalHeaders[columnKey] = allColumnHeaders[columnKey];
        }
        // Otherwise, it's part of a group we've already handled, so we do nothing.
    }

    return finalHeaders;
}
