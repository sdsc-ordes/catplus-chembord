import type { FilterCategory } from '$lib/config/sparqlQueries'

/**
 * Selection State of the Search Form
 */
export interface SelectionState {
    selected: Set<string>;
    display: string;
    active: boolean;
}

/**
 * initializes the selection state of the Search Form
 */
export function initializeCategoryState(categoryKey: FilterCategory, categoryData: string[]): SelectionState {
    const initialValues = categoryData ?? [];
    const initialSet = new Set(initialValues);
    const initialDisplay = initialValues.length > 0 ? initialValues.join(', ') : '';
    const initialActive = initialSet.size > 0;
    return { selected: initialSet, display: initialDisplay, active: initialActive };
}

/** Toggles selection state on search form
 */
export function toggleGenericSelection<T extends FilterCategory>(
    selectionsState: Record<T, SelectionState>,
    category: T,
    value: string,
    isChecked: boolean
): void {
    const currentCategoryState = selectionsState[category];
    if (!currentCategoryState) {
        console.warn(`Category "${category}" not found in selections state.`);
        return;
    }
    const updatedSet = new Set(currentCategoryState.selected);
    if (isChecked) {
        updatedSet.add(value);
    } else {
        updatedSet.delete(value);
    }
    selectionsState[category].selected = updatedSet;
    const selectedArray = [...updatedSet];
    selectionsState[category].display = selectedArray.length > 0 ? selectedArray.join(',') : '';
    selectionsState[category].active = updatedSet.size > 0;
}

/** Update Selections
 */
export function updateSelections<T extends FilterCategory>(
    selectionsState: Record<T, SelectionState>,
    category: T,
    value: string,
): void {
    const currentCategoryState = selectionsState[category];
    if (!currentCategoryState) {
        console.warn(`Category "${category}" not found in selections state.`);
        return;
    }
    const updatedSet = new Set(currentCategoryState.selected);
    if (value) {
        updatedSet.add(value);
    }
    selectionsState[category].selected = updatedSet;
    const selectedArray = [...updatedSet];
    selectionsState[category].display = selectedArray.length > 0 ? selectedArray.join(',') : '';
    selectionsState[category].active = updatedSet.size > 0;
}
