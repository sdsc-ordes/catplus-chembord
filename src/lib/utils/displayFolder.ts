/**
 * Extracts a date in YYYY/MM/DD format from a path string.
 * Expects a path like "batch/YYYY/MM/DD/..."
 *
 * @param pathString The input string, e.g., "batch/2024/05/16/24/"
 * @returns The extracted date string "YYYY/MM/DD", or null if the format is not matched or input is invalid.
 */
export function extractDateFromPath(pathString: string | null | undefined): string | null {
    if (!pathString) {
      return null; // Handle null or undefined input
    }

    const match = pathString.match(/^batch\/(\d{4})\/(\d{2})\/(\d{2})\//i);

    if (match && match[1] && match[2] && match[3]) {
      const year = match[1];  // First captured group (YYYY)
      const month = match[2]; // Second captured group (MM)
      const day = match[3];   // Third captured group (DD)
      return `${year}/${month}/${day}`;
    } else {
      return null;
    }
  }