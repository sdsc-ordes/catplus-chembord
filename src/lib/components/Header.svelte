<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import Paperclip from '@lucide/svelte/icons/paperclip';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Home from '@lucide/svelte/icons/home';
	import Database from '@lucide/svelte/icons/database';
	import CircleUser from '@lucide/svelte/icons/circle-user';
	import Search from '@lucide/svelte/icons/search';
</script>

<AppBar classes="flex items-left">
	{#snippet lead()}
	    <a href="/" class="flex items-center mx-4"><Home size={20} />Home</a>
	    <a href="/search" class="flex items-center"><Search size={20} />Search</a>
		<a href="/explore" class="flex items-center"><Database size={20} />Data</a>
	{/snippet}
	{#snippet trail()}
		<Paperclip size={20} />
		<Calendar size={20} />
		<CircleUser size={20} />
	{/snippet}
	<span>CAT+ Chemboard</span>
</AppBar>
