<script lang="ts">
    import type { PageProps } from './$types';

    let { params }: PageProps = $props();

    const mppMode = $derived(params.mode)
</script>

<h1>MPP Charge {mppMode} Demo</h1>
<p>This page demonstrates the <code>{mppMode}</code> method of the MPP protocol, through the Stellar network.</p>
