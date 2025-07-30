// --- Example Usage ---
import { createSparqlQuery } from '$lib/server/qleverResult'; // Adjust the import path as necessary
import type { SparqlPagination, SparqlFilters } from '$lib/server/qleverResult'; // Adjust the import path as necessary
import { getSparqlQueryResult } from '$lib/server/qlever';
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
  // 1. Define your filters and pagination with arrays for values
  const myFilters: SparqlFilters = {
    reactionName: ["Caffeine synthesis"],
    chemicalName: ["methyl iodide", "Tetradeuteromethanol"],
    reactionType: ["N-methylation"],
  };

  const myPagination: SparqlPagination = {
    limit: 25,
    offset: 0,
  };

  // 2. Generate the query
  const generatedQueries = createSparqlQuery(myFilters, myPagination);

  // 3. Log the result to see the generated query
  console.log(generatedQueries.resultsQuery);

  const sparqlResult: Record<string, string>[] = await getSparqlQueryResult(
        generatedQueries.resultsQuery);
  console.log(sparqlResult);

}

// FILTER (?chemicalName = "methyl iodide")
//FILTER (?casNumber = "123-11-5")
//FILTER (?reactionName = "Caffeine synthesis")
//FILTER (?smiles = "[2H]C([2H])([2H])O[2H]" )
//FILTER (?reactionType = "N-methylation")

