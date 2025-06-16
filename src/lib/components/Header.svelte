<script lang="ts">
    import { AppBar } from '@skeletonlabs/skeleton-svelte';
    import { base } from '$app/paths';
    import { page } from '$app/stores'; // <-- Import the page store

    // Import all your icons
    import Paperclip from '@lucide/svelte/icons/paperclip';
    import Calendar from '@lucide/svelte/icons/calendar';
    import Home from '@lucide/svelte/icons/home';
    import Database from '@lucide/svelte/icons/database';
    import CircleUser from '@lucide/svelte/icons/circle-user';
    import Search from '@lucide/svelte/icons/search';

    // --- Define your navigation items in an array ---
    const navItems = [
        { href: `${base}/`, label: 'Home', icon: Home },
        { href: `${base}/search`, label: 'Search', icon: Search },
        { href: `${base}/data`, label: 'Data', icon: Database }
    ];
</script>

<AppBar classes="flex items-left">
    {#snippet lead()}
        {#each navItems as item}
            <a
                href={item.href}
                class="flex items-center mx-4 gap-x-2 transition-colors hover:text-primary-500"
                class:text-primary-500={$page.url.pathname === item.href}
            >
                <svelte:component this={item.icon} size={20} />
                <span>{item.label}</span>
            </a>
        {/each}
    {/snippet}
    {#snippet trail()}
        <Paperclip size={20} />
        <Calendar size={20} />
        <CircleUser size={20} />
    {/snippet}
    <span>CAT+ Chemboard</span>
</AppBar>
