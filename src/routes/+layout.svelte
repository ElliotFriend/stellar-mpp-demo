<script lang="ts">
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';

    import Header from '$lib/components/ui/Header.svelte';
    import Footer from '$lib/components/ui/Footer.svelte';

    let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen flex-col bg-gray-50 text-gray-900">
    <Header />

    <main class="mx-auto max-w-4xl flex-1 px-6 py-10">
        {@render children()}
    </main>

    <Footer />
</div>
