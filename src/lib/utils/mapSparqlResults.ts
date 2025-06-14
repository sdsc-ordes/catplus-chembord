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
 * columns into single, descriptive headers.
 *
 * @param {FilterCategory[]} resultColumns - The columns to display.
 * @param {Record<FilterCategory, string>} allColumnHeaders - All possible headers.
 * @returns {Record<string, string>} - The final headers for the table.
 */
export function createDynamicTableHeaders(
    resultColumns: FilterCategory[],
    allColumnHeaders: Record<FilterCategory, string>
): Record<string, string> {
    const finalHeaders: Record<string, string> = {};

    // For efficient lookups
    const columnsSet = new Set(resultColumns);

    // --- Define the groups ---
    const reactionGroup = {
        REACTION_TYPE: "Type",
        REACTION_NAME: "Name",
    };

    const chemicalGroup = {
        CHEMICAL_NAME: "Name",
        CAS: "CAS",
        SMILES: "Smiles",
    };

    // --- Process Reaction Group ---
    const presentReactionParts = Object.entries(reactionGroup)
        .filter(([key]) => columnsSet.has(key as FilterCategory))
        .map(([, value]) => value); // Get the display part, e.g., "Name", "Type"

    if (presentReactionParts.length > 0) {
        finalHeaders.REACTION_GROUP = `Reaction (${presentReactionParts.join(", ")})`;
    }

    // --- Process Chemical Group ---
    const presentChemicalParts = Object.entries(chemicalGroup)
        .filter(([key]) => columnsSet.has(key as FilterCategory))
        .map(([, value]) => value);

    if (presentChemicalParts.length > 0) {
        finalHeaders.CHEMICAL_GROUP = `Chemical (${presentChemicalParts.join(", ")})`;
    }

    // --- Process Remaining Columns ---
    const groupedKeys = new Set([...Object.keys(reactionGroup), ...Object.keys(chemicalGroup)]);

    resultColumns.forEach(columnKey => {
        if (!groupedKeys.has(columnKey)) {
            finalHeaders[columnKey] = allColumnHeaders[columnKey];
        }
    });

    return finalHeaders;
}
