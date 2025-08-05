<script lang="ts">
    import { enhance, applyAction } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import Database from '@lucide/svelte/icons/database';

    // 1. Receive initial props from the parent page.
    let { form, year, month, day, number } = $props();

    // 2. Create local, mutable state for each input, initialized by the props.
    //    This allows the user's typing to be tracked reactively.
    let yearValue = $state(year ?? '');
    let monthValue = $state(month ?? '');
    let dayValue = $state(day ?? '');
    let numberValue = $state(number ?? '');

    function handleSubmit() {
        return async ({ result }: { result: any }) => {
            if (result.type === 'redirect') {
                await invalidateAll();
            }
            await applyAction(result);
        };
    }
</script>

<div class="space-y-4 rounded p-4">
    <h1 class="mb-4 text-2xl font-bold text-surface-800-200">Campaign Data</h1>

    <form method="POST" action="?/filter" class="space-y-4 p-4" use:enhance={handleSubmit}>
        <div class="label">
            <span>Filter Campaigns:</span>
        </div>

        <label class="label">
            <span class="label-text">Year as YYYY</span>
            <input name="year" type="text" class="input" placeholder="YYYY" bind:value={yearValue} />
            {#if form?.errors?.year}
                <span class="text-sm text-red-500">{form.errors.year[0]}</span>
            {/if}
        </label>

        {#if yearValue}
            <label class="label">
                <span class="label-text">Month as MM</span>
                <input name="month" type="text" class="input" placeholder="MM" bind:value={monthValue} />
                {#if form?.errors?.month}
                    <span class="text-sm text-red-500">{form.errors.month[0]}</span>
                {/if}
            </label>
        {/if}

        {#if yearValue && monthValue}
            <label class="label">
                <span class="label-text">Day as DD</span>
                <input name="day" type="text" class="input" placeholder="DD" bind:value={dayValue} />
                {#if form?.errors?.day}
                    <span class="text-sm text-red-500">{form.errors.day[0]}</span>
                {/if}
            </label>
        {/if}

        {#if yearValue && monthValue && dayValue}
            <label class="label">
                <span class="label-text">Number as NN</span>
                <input name="number" type="text" class="input" placeholder="NN" bind:value={numberValue} />
                {#if form?.errors?.number}
                    <span class="text-sm text-red-500">{form.errors.number[0]}</span>
                {/if}
            </label>
        {/if}

        {#if form?.success}
            <div class="rounded bg-green-200 p-2 text-green-800">
                {form.message}
            </div>
        {/if}

        <div class="flex justify-start">
            <button type="submit" class="btn preset-filled-primary-500 w-full">
                <Database />Apply Path Filter
            </button>
        </div>
    </form>
</div>
