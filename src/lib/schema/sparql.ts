export interface SparqlSearchResult {
	prefix: string;
	campaignName: string;
	chemicalName: string;
	smiles: string;
	cas: string;
	reactionName: string;
	reactionType: string;
}

export type FlatSparqlRow = { [key: string]: string };

export interface SparqlBinding {
    [key: string]: { // This is the SPARQL variable name, e.g., "s", "p", "o"
        type: 'uri' | 'literal' | 'bnode';
        value: string; // This is the actual value we want to extract
        datatype?: string;
        'xml:lang'?: string;
    };
}
