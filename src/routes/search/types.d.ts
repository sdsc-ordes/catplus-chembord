interface Props {
    initialFilters: string;
    picklists: PicklistData;
    results: SparqlBinding[]
}

// Filter categories
export const FilterCategoryConstants = {
    CHEMICAL_NAME: 'chemicalName',
    CAMPAIGN_NAME: 'campaignName',
    SMILES: 'smiles',
    CAS: 'cas',
    REACTION_TYPE: 'reactionType',
    REACTION_NAME: 'reactionName',
} as const;

// Keys of filter categories
export type FilterCategory = typeof FilterCategoryConstants[keyof typeof FilterCategoryConstants];

// option data for selection form coming from sparql
interface PicklistData {
    chemicalName: string[];
    campaignName: string[];
    smiles: string[];
    cas: string[];
    reactionType: string[];
    reactionName: string[];
}

// Sparql Results
interface SparqlBinding {
     [key: string]: {
         type: 'uri' | 'literal' | 'bnode';
         value: string;
         datatype?: string;
         'xml:lang'?: string
    };
}
