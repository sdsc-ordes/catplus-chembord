/**
 * Constants for the Search categories
 */
export const FilterCategoryConstants = {
    CHEMICAL_NAME: 'chemicalName',
    CAMPAIGN_NAME: 'campaignName',
    SMILES: 'smiles',
    CAS: 'cas',
    REACTION_TYPE: 'reactionType',
    REACTION_NAME: 'reactionName',
} as const;

export const ResultTableHeaders: string[] = [
    "Campaign Path", "Campaign Name", "Chemical Name", "Smiles",
    "CAS", "Reaction Type", "Reaction Type",
]
