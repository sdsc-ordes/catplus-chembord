<script lang="ts">
  import { base } from '$app/paths';
  import { publicConfig } from '$lib/config';
</script>
<footer class="p-8 md:p-12 flex flex-col items-center gap-8 bg-surface-100 dark:bg-surface-800">
    <div class="flex flex-wrap justify-center items-center gap-10 md:gap-16">
        <a href="{publicConfig.PUBLIC_SWISSCAT_URL}" target="_blank" rel="noopener" class="opacity-75 hover:opacity-100 transition-opacity">
            <img
                src="{base}/catplus-logo.png"
                alt="CAT Plus at EPFL"
                class="h-14 w-auto"
            />
        </a>
        <a href="{publicConfig.PUBLIC_SDSC_URL}" target="_blank" rel="noopener" class="opacity-75 hover:opacity-100 transition-opacity">
            <img
                src="{base}/logo-sdsc.png"
                alt="SDSC Swiss Data Science Center"
                class="h-14 w-auto"
            />
        </a>
    </div>

    <p class="text-sm text-surface-500 dark:text-surface-400">
        Chembord 2025
    </p>

</footer>
