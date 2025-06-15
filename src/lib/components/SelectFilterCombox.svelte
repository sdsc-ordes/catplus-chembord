<script lang="ts">
    import { Combobox } from '@skeletonlabs/skeleton-svelte';
    import { selectedItems } from '$lib/shared.svelte';

    let {
        categoryKey,
        options,
        transformedPicklist
    } = $props();
</script>

<Combobox
	data={transformedPicklist}
	value={selectedItems[categoryKey]}
	placeholder="Select..."
    multiple={true}
    onValueChange={(e) => {
        selectedItems[categoryKey] = e.value;
    }}
	defaultOpen={true}
	inputBehavior="autocomplete"
	selectionBehavior="preserve"
	positioning="start"
    classes=""
    optionClasses="text-xs"
    contentClasses="text-xs"
    positionerClasses=""
    labelClasses="text-xs"
	composite={true}
/>
