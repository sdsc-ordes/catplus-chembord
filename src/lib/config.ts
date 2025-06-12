// Configuration
import { env as publicEnv } from '$env/dynamic/public';
import { getValueByPath } from '$lib/utils/getObjectValue';

// Search Filter Categories as type
export type FilterCategory =
    | 'CAMPAIGN_NAME'
    | 'REACTION_TYPE'
    | 'REACTION_NAME'
    | 'CHEMICAL_NAME'
    | 'CAS'
    | 'SMILES'
    | 'DEVICES';

// Search Categories Sorted
export const FilterCategoriesSorted: FilterCategory[] = [
    'CAMPAIGN_NAME',
    'REACTION_TYPE',
    'REACTION_NAME',
    'CHEMICAL_NAME',
    'CAS',
    'SMILES',
    'DEVICES',
];

// Sparql Queries for Search Filter Categories
export const SparqlFilterQueries: Record<FilterCategory, string> = {
    CAS: `PREFIX cat: <http://example.org/catplus/ontology> SELECT DISTINCT ?casNumber WHERE { ?s cat:casNumber ?casNumber .}`,
    CHEMICAL_NAME: `PREFIX allores: <http://purl.allotrope.org/ontologies/result#> SELECT DISTINCT ?chemicalName WHERE { ?s allores:AFR_0002292 ?chemicalName .}`,
    SMILES: `PREFIX allores: <http://purl.allotrope.org/ontologies/result#> SELECT DISTINCT ?smiles WHERE { ?s allores:AFR_0002295 ?smiles .}`,
    REACTION_NAME: `PREFIX cat: <http://example.org/catplus/ontology/> SELECT DISTINCT ?reactionName WHERE { ?s cat:reactionName ?reactionName .}`,
    REACTION_TYPE: `PREFIX cat: <http://example.org/catplus/ontology/> SELECT DISTINCT ?reactionType WHERE { ?s cat:reactionType ?reactionType .}`,
    CAMPAIGN_NAME: `PREFIX cat: <http://example.org/catplus/ontology/> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX schema: <https://schema.org/> SELECT DISTINCT ?campaignName WHERE {?Campaign a cat:Campaign ; schema:name ?campaignName}`,
    DEVICES: `PREFIX cat: <http://example.org/catplus/ontology/> PREFIX schema: <https://schema.org/> PREFIX allores: <http://purl.allotrope.org/ontologies/result#> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> SELECT DISTINCT ?name WHERE {{ ?s1 a allores:AFR_0002567 ; allores:AFR_0002568 ?name .} UNION { ?s1 rdf:type cat:AddAction ; allores:AFR_0001723 ?name .}}`
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
    DEVICES: "dv",
}

export const ResultSparqlQueryBlocks = {
    prefixClause: `PREFIX obo: <http://purl.obolibrary.org/obo/> PREFIX allores: <http://purl.allotrope.org/ontologies/result#> PREFIX cat: <http://example.org/catplus/ontology/> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX schema: <https://schema.org/>`,
    selectClause: `SELECT ?cu`,
    whereClause: `WHERE { ?s a cat:Campaign ; cat:hasBatch ?b; cat:hasChemical ?c ; schema:name ?cp ; schema:contentURL ?cu . ?b cat:reactionType ?rt ; cat:reactionName ?rn . ?c allores:AFR_0002295 ?sm ; allores:AFR_0002292 ?cn ; cat:casNumber ?ca .`,
    filterClause: `}`,
    groupByClause: `GROUP BY ?cu`,
}

export const publicConfig = {
  PUBLIC_QLEVER_UI_URL: publicEnv.PUBLIC_QLEVER_UI_URL || process.env.PUBLIC_QLEVER_UI_URL,
  PUBLIC_CATPLUS_ONTOLOGY_URL: publicEnv.PUBLIC_QLEVER_UI_URL || process.env.PUBLIC_CATPLUS_ONTOLOGY_URL,
  PUBLIC_RESULTS_PER_PAGE: publicEnv.PUBLIC_RESULTS_PER_PAGE || process.env.PUBLIC_RESULTS_PER_PAGE,
}

export function validatePublicConfiguration(): void {
    const requiredPaths = [
        'PUBLIC_QLEVER_UI_URL',
        'PUBLIC_CATPLUS_ONTOLOGY_URL',
        'PUBLIC_RESULTS_PER_PAGE',
    ];

    const missingVars: string[] = [];

    // Loop through and check all required variables.
    // Check if svelte is configured correctly by looking for the base path, etc.
    requiredPaths.forEach(path => {
        if (!getValueByPath(publicConfig, path)) {
        missingVars.push(path);
        }
    })

    // --- Final Check and Error Handling ---
    if (missingVars.length > 0) {
        const uniqueMissingVars = Array.from(new Set(missingVars));
        const errorMessage = `Missing required public environment variables: ${uniqueMissingVars.join(', ')}.`;
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    // --- Success Logging ---
    console.info('Public Configuration validated successfully');
}
