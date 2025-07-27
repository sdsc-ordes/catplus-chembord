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
    CAS: `PREFIX cat: <http://example.org/catplus/ontology/> SELECT DISTINCT ?casNumber WHERE { ?s cat:casNumber ?casNumber .}`,
    CHEMICAL_NAME: `PREFIX allores: <http://purl.allotrope.org/ontologies/result#> SELECT DISTINCT ?chemicalName WHERE { ?s allores:AFR_0002292 ?chemicalName .}`,
    SMILES: `PREFIX allores: <http://purl.allotrope.org/ontologies/result#> SELECT DISTINCT ?smiles WHERE { ?s allores:AFR_0002295 ?smiles .}`,
    REACTION_NAME: `PREFIX cat: <http://example.org/catplus/ontology/> SELECT DISTINCT ?reactionName WHERE { ?s cat:reactionName ?reactionName .}`,
    REACTION_TYPE: `PREFIX cat: <http://example.org/catplus/ontology/> SELECT DISTINCT ?reactionType WHERE { ?s cat:reactionType ?reactionType .}`,
    CAMPAIGN_NAME: `PREFIX cat: <http://example.org/catplus/ontology/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX schema: <https://schema.org/> SELECT DISTINCT ?campaignName WHERE {?Campaign rdf:type cat:Campaign ; schema:name ?campaignName}`,
    DEVICES: `PREFIX cat: <http://example.org/catplus/ontology/> PREFIX allores: <http://purl.allotrope.org/ontologies/result#> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> SELECT DISTINCT ?name WHERE {{ ?s1 a allores:AFR_0002567 ; allores:AFR_0002568 ?name .} UNION { ?s1 rdf:type cat:AddAction ; allores:AFR_0001723 ?name .}}`
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
    'DEVICES',
];

// Qlever raw results
export interface QleverRawResult {
    contentUrl: string;
    campaignName: string;
    reactionName: string;
    reactionType: string;
    chemicalName: string;
    casNumber: string;
    smiles: string;
}

export const SparqlVariables: Record<ResultTableColumns, string> = {
    CONTENT_URL: "contentUrl",
    CAMPAIGN_NAME: "campaignName",
    REACTION_TYPE: "reactionType",
    REACTION_NAME: "reactionName",
    CHEMICAL_NAME: "chemicalName",
    CAS: "casNumber",
    SMILES: "smiles",
    DEVICES: "device",
}

// Defines the properties for each queryable element
interface SparqlConfig {
    var: string; // The SPARQL variable name (e.g., ?campaignName)
    pattern: string; // The triple pattern to find this variable
    isGroupKey: boolean; // Is this a single-valued property to GROUP BY?
    isFilterable?: boolean; // Can this be used in the subquery filter? (Defaults to true)
}

// The new, more powerful configuration object
export const SparqlQueryConfig: Record<FilterCategory, SparqlConfig> = {
    CAMPAIGN_NAME: {
        var: '?campaignName',
        pattern: '?s schema:name ?campaignName .',
        isGroupKey: true,
    },
    REACTION_TYPE: {
        var: '?reactionType',
        pattern: '?batch cat:reactionType ?reactionType .',
        isGroupKey: true,
    },
    REACTION_NAME: {
        var: '?reactionName',
        pattern: '?batch cat:reactionName ?reactionName .',
        isGroupKey: true,
    },
    CHEMICAL_NAME: {
        var: '?chemicalName',
        pattern: '?chemical allores:AFR_0002292 ?chemicalName .',
        isGroupKey: true,
    },
    CAS: {
        var: '?casNumber',
        pattern: '?chemical cat:casNumber ?casNumber .',
        isGroupKey: true,
    },
    SMILES: {
        var: '?smiles',
        pattern: '?chemical allores:AFR_0002295 ?smiles .',
        isGroupKey: true,
    },
    DEVICES: {
        var: '?device',
        pattern: '?s cat:hasDevice ?device .',
        isGroupKey: true,
    }
};

export const publicConfig = {
  PUBLIC_QLEVER_UI_URL: publicEnv.PUBLIC_QLEVER_UI_URL || process.env.PUBLIC_QLEVER_UI_URL,
  PUBLIC_CATPLUS_ONTOLOGY_URL: publicEnv.PUBLIC_CATPLUS_ONTOLOGY_URL || process.env.PUBLIC_CATPLUS_ONTOLOGY_URL,
  PUBLIC_RESULTS_PER_PAGE: parseInt(publicEnv.PUBLIC_RESULTS_PER_PAGE || process.env.PUBLIC_RESULTS_PER_PAGE),
  PUBLIC_SWISSCAT_URL: publicEnv.PUBLIC_SWISSCAT_URL || process.env.PUBLIC_SWISSCAT_URL,
  PUBLIC_SDSC_URL: publicEnv.PUBLIC_SDSC_URL || process.env.PUBLIC_SDSC_URL,
  PUBLIC_CHEMBORD_GITHUB_URL: publicEnv.PUBLIC_CHEMBORD_GITHUB_URL || process.env.PUBLIC_CHEMBORD_GITHUB_URL,
}

export function validatePublicConfiguration(): void {
    const requiredPaths = [
        'PUBLIC_QLEVER_UI_URL',
        'PUBLIC_CATPLUS_ONTOLOGY_URL',
        'PUBLIC_RESULTS_PER_PAGE',
        'PUBLIC_SWISSCAT_URL',
        'PUBLIC_SDSC_URL',
        'PUBLIC_CHEMBORD_GITHUB_URL'
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
