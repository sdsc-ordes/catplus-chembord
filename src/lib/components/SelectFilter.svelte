<script lang="ts">
    let {
        key,
        optionValue,
		selections,
		toggleGenericSelection,
    } = $props();
</script>
<label class="flex cursor-pointer items-center space-x-2">
    <input
        class="checkbox"
        type="checkbox"
        value={optionValue}
        checked={selections[key].selected.has(optionValue)}
        onchange={(e) =>
            toggleGenericSelection(
                selections,
                key,
                optionValue,
                e.currentTarget.checked
            )}
    />
    <p class="break-words">{optionValue}</p>
</label>
