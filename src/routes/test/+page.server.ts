// --- Example Usage ---
import { createSparqlQuery } from '$lib/server/qleverResult'; // Adjust the import path as necessary
import type { SparqlPagination, SparqlFilters } from '$lib/server/qleverResult'; // Adjust the import path as necessary
import { getSparqlQueryResult } from '$lib/server/qlever';
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
  // 1. Define your filters and pagination with arrays for values
  const myFilters: SparqlFilters = {
    reactionName: ["Caffeine synthesis"],
    chemicalName: ["methyl iodide"],
    reactionType: ["N-methylation"],
  };

  const myPagination: SparqlPagination = {
    limit: 25,
    offset: 0,
  };

  // 2. Generate the query
  const generatedQuery = createSparqlQuery({}, myPagination);

  // 3. Log the result to see the generated query
  console.log(generatedQuery);

  const sparqlResult: Record<string, string>[] = await getSparqlQueryResult(
        generatedQuery
  );
  console.log(sparqlResult);

}

