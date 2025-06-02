// Configuration

// Results per page
export const RESULTS_PER_PAGE = 5;

// Search Filter Categories as type
export type FilterCategory =
    | 'CAMPAIGN_NAME'
    | 'REACTION_TYPE'
    | 'REACTION_NAME'
    | 'CHEMICAL_NAME'
    | 'CAS'
    | 'SMILES';

// Search Categories Sorted
export const FilterCategoriesSorted: FilterCategory[] = [
    'CAMPAIGN_NAME',
    'REACTION_TYPE',
    'REACTION_NAME',
    'CHEMICAL_NAME',
    'CAS',
    'SMILES',
];

// Sparql Queries for Search Filter Categories
export const SparqlFilterQueries: Record<FilterCategory, string> = {
    CAS: `PREFIX cat: <http://example.org/cat#> SELECT DISTINCT ?casNumber WHERE { ?s cat:casNumber ?casNumber .}`,
    CHEMICAL_NAME: `PREFIX allores: <http://purl.allotrope.org/ontologies/result#> SELECT DISTINCT ?chemicalName WHERE { ?s allores:AFR_0002292 ?chemicalName .}`,
    SMILES: `PREFIX allores: <http://purl.allotrope.org/ontologies/result#> SELECT DISTINCT ?smiles WHERE { ?s allores:AFR_0002295 ?smiles .}`,
    REACTION_NAME: `PREFIX cat: <http://example.org/cat#> SELECT DISTINCT ?reactionName WHERE { ?s cat:reactionName ?reactionName .}`,
    REACTION_TYPE: `PREFIX cat: <http://example.org/cat#> SELECT DISTINCT ?reactionType WHERE { ?s cat:reactionType ?reactionType .}`,
    CAMPAIGN_NAME: `PREFIX cat: <http://example.org/cat#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX schema: <https://schema.org/> SELECT DISTINCT ?campaignName WHERE {?Campaign a cat:Campaign ; schema:name ?campaignName}`,
};

// Search Result Column Types
export type ResultTableColumns = FilterCategory | 'CONTENT_URL';

// Search Result Table Columns Sorted
export const ResultTableColumnsSorted: ResultTableColumns[] = [
    'CONTENT_URL',
    'CAMPAIGN_NAME',
    'REACTION_TYPE',
    'REACTION_NAME',
    'CHEMICAL_NAME',
    'CAS',
    'SMILES',
];

// Qlever raw results
export interface QleverRawResult {
    cu: string;
    cp: string;
    rn: string;
    rt: string;
    cn: string;
    ca: string;
    sm: string;
}

export const SparqlVariables: Record<ResultTableColumns, string> = {
    CONTENT_URL: "cu",
    CAMPAIGN_NAME: "cp",
    REACTION_TYPE: "rt",
    REACTION_NAME: "rn",
    CHEMICAL_NAME: "cn",
    CAS: "ca",
    SMILES: "sm",
}

export const BaseResultSparqlQuery = {
    baseClause: `PREFIX obo: <http://purl.obolibrary.org/obo/> PREFIX allores: <http://purl.allotrope.org/ontologies/result#> PREFIX cat: <http://example.org/cat#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX schema: <https://schema.org/> SELECT ?cu ?cp ?rt ?rn ?sm ?ca ?cn WHERE { ?s a cat:Campaign ; cat:hasBatch ?b; cat:hasChemical ?c ; schema:name ?cp ; schema:contentURL ?cu . ?b cat:reactionType ?rt ; cat:reactionName ?rn . ?c allores:AFR_0002295 ?sm ; allores:AFR_0002292 ?cn ; cat:casNumber ?ca . `,
    orderByClause: `} ORDER BY ?cu`
}
