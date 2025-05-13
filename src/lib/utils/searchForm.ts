import type { SelectionState, FilterCategory } from '$lib/types/search'

/**
 * initializes the state of the Search Form
 *
 * @param data for the search filter category
 * @param categoryKey a search filter category
 * @returns categoryData: selection state entry for that category
 */
export function initializeCategoryState(categoryKey: FilterCategory, categoryData: string[]): SelectionState {
    const initialValues = categoryData ?? [];
    const initialSet = new Set(initialValues);
    const initialDisplay = initialValues.length > 0 ? initialValues.join(', ') : '';
    const initialActive = initialSet.size > 0;
    return { selected: initialSet, display: initialDisplay, active: initialActive };
}

/**
 * toggle generic selection
 *
 * @param data for the search filter category
 * @param categoryKey a search filter category
 * @returns categoryData: selection state entry for that category
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
