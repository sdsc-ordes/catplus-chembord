/**
 * @file Contains functions for transforming SPARQL query results into a display-friendly format.
 */

/**
 * Defines the structure of a raw query result row from your getSparqlQueryResult function.
 */
interface RawQueryResultRow {
  contenturl?: string;
  deviceTypes?: string;
  chemicals?: string;
  peakIdentifiers?: string;
}

/**
 * Defines the structure for a single transformed column, including its value and display status.
 */
export interface TransformedColumn {
  value: string | string[];
  display: boolean;
}

/**
 * Defines the structure of the fully transformed and structured result object.
 * This is a dictionary where each key is a column name.
 */
export interface TransformedResult {
  Campaign: TransformedColumn;
  Product: TransformedColumn;
  ProductFile: TransformedColumn;
  Devices: TransformedColumn;
  Chemicals: TransformedColumn;
  Peaks: TransformedColumn;
  ContentURL: TransformedColumn; // Keep original for reference
}

/**
 * Transforms a single row from the SPARQL query result into a structured dictionary.
 * Each property in the dictionary contains the column's value and a display flag.
 * @param row The raw result row from the query.
 * @returns A transformed result object with parsed and split data.
 */
export const transformQueryResultRow = (row: RawQueryResultRow): TransformedResult => {
  const contenturl = row.contenturl || '';

  // 1. Parse the contenturl into its constituent parts
  const urlParts = contenturl.split('/');
  const productFile = urlParts[urlParts.length - 1] || '';
  const product = productFile.split('-').slice(0, 2).join('-');

  // 2. Reconstruct the campaign path
  const campaignPathIndex = urlParts.indexOf('batch');
  const campaign = campaignPathIndex !== -1
    ? urlParts.slice(campaignPathIndex, -1).join('/') + '/'
    : 'N/A';

  // 3. Split the aggregated strings into arrays
  const devices = row.deviceTypes ? row.deviceTypes.split('; ').map(s => s.trim()).filter(Boolean) : [];
  const chemicals = row.chemicals ? row.chemicals.split(' | ').map(s => s.trim()).filter(Boolean) : [];
  const peaks = row.peakIdentifiers ? row.peakIdentifiers.split('; ').map(s => s.trim()).filter(Boolean) : [];

  // 4. Construct the final dictionary with display flags
  return {
    Campaign: { value: campaign, display: true },
    Product: { value: product, display: true },
    Devices: { value: devices, display: true },
    Chemicals: { value: chemicals, display: true },
    Peaks: { value: peaks, display: false }, // This column will be hidden by default
    ProductFile: { value: productFile, display: false }, // Not typically displayed in the main table
    ContentURL: { value: contenturl, display: false }, // For reference/debugging, not display
  };
};
