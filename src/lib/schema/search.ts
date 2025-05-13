/**
 * Stores the selections in the Search Form
 */
export interface SelectionState {
    selected: Set<string>;
    display: string; // display the selections as a string
    active: boolean; // indicator whether the selection category is active
}
