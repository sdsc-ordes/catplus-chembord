// Define types needed for props and state
interface PicklistData {
    chemicalName: string[];
    campaignName: string[];
    smiles: string[];
    cas: string[];
    reactionType: string[];
    reactionName: string[];
}

type FilterCategory = keyof PicklistData;

interface SelectionState {
    selected: Set<string>;
    display: string;
    active: boolean;
}

interface SparqlBinding {
     [key: string]: {
         type: 'uri' | 'literal' | 'bnode';
         value: string;
         datatype?: string;
         'xml:lang'?: string
    };
}
