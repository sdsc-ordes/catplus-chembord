import {
    type FilterCategory, FilterCategoriesSorted
} from '$lib/config';

const initialEmptySelectionsWithAllKeys = Object.fromEntries(
  FilterCategoriesSorted.map(categoryKey => [categoryKey, [] as string[]])
) as Record<FilterCategory, string[]>;

/**
 * A shared store is necessary to keep the selected items in sync across components.
 */
export let selectedItems = $state<Record<FilterCategory, string[]>>(initialEmptySelectionsWithAllKeys);
