export const mockPicklists: Record<string, string[]> = {
	chemicalName: [
		"Toluene", "Styrene", "4-(Difluoromethyl)benzyl bromide", "4-methoxybenzaldehyde",
		"methanol", "methyl iodide", "Sodium methoxide", "theobromine", "Chloroform",
		"tert-Butyl methyl-d3 ether", "Tetradeuteromethanol", "Acetonitrile", "Water"
	],
	campaignName: ["Caffeine Synthesis"],
	smiles: [
		"CC1=CC=CC=C1", "C=CC1=CC=CC=C1", "BrCc1ccc(cc1)C(F)(F)F", "COC1=CC=C(C=C1)C=O",
		"CO", "CI", "C[O-].[Na+]", "CN1C=NC2=C1C(=O)NC(=O)N2C", "C(Cl)(Cl)Cl",
		"[2H]C([2H])([2H])OC(C)(C)C", "[2H]C([2H])([2H])O[2H]", "CC#N", "O"
	],
	cas: [
		"108-88-3", "100-42-5", "873373-34-3", "123-11-5", "67-56-1", "74-88-4",
		"124-41-4", "83-67-0", "67-66-3", "29366-08-3", "811-98-3", "75-05-8", "7732-18-5"
	],
	reactionType: ["N-methylation"],
	reactionName: ["Caffeine Synthesis"]
};


// Define the structure of a single SPARQL result row
export interface SparqlResultRow {
	s3link: { type: 'uri'; value: string };
	campaignName: { type: 'literal'; value: string };
	chemicalName: { type: 'literal'; value: string };
	smiles: { type: 'literal'; value: string };
	cas: { type: 'literal'; value: string };
	reactionName: { type: 'literal'; value: string };
	reactionType: { type: 'literal'; value: string };
}

// Mock SPARQL data function (can be defined here or imported)
export function getMockSparqlResults(filters?: Record<string, string>): SparqlResultRow[] {
	//console.log('Load: Generating mock SPARQL results with filters:', filters);
	// In a real scenario, use filters to query SPARQL endpoint
	return [
		{ s3link: { type: 'uri', value: 's3://batch/2024/05/16/25/' }, campaignName: { type: 'literal', value: 'Caffeine Synthesis Run 24' }, chemicalName: { type: 'literal', value: 'theobromine' }, smiles: { type: 'literal', value: 'COC1=CC=C(C=C1)C=O' }, cas: { type: 'literal', value: '83-67-0' }, reactionName: { type: 'literal', value: 'Caffeine synthesis' }, reactionType: { type: 'literal', value: 'N-methylation' } },
		{ s3link: { type: 'uri', value: 's3://batch/2024/05/16/24/' }, campaignName: { type: 'literal', value: 'Aspirin Trial' }, chemicalName: { type: 'literal', value: 'acetylsalicylic acid' }, smiles: { type: 'literal', value: 'CC1=CC=CC=C1' }, cas: { type: 'literal', value: '50-78-2' }, reactionName: { type: 'literal', value: 'Esterification' }, reactionType: { type: 'literal', value: 'Acetylation' } },
		{ s3link: { type: 'uri', value: 's3://batch/2024/05/16/28/' }, campaignName: { type: 'literal', value: 'Caffeine Synthesis Run 24' }, chemicalName: { type: 'literal', value: 'methyl iodide' }, smiles: { type: 'literal', value: 'CN1C=NC2=C1C(=O)NC(=O)N2C' }, cas: { type: 'literal', value: '74-88-4' }, reactionName: { type: 'literal', value: 'Caffeine synthesis' }, reactionType: { type: 'literal', value: 'N-methylation' } },
	];
}
