<script lang="ts">
    import ContentLayout from '$lib/components/ContentLayout.svelte';
</script>

{#snippet sidebar()}
    <p>Sidebar content</p>
{/snippet}

{#snippet main()}
    <p>Main Content</p>
{/snippet}

<ContentLayout {sidebar} {main} />
