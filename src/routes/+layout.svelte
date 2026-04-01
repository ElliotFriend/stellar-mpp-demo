<script lang="ts">
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import { page } from '$app/state';

    let { children } = $props();

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/free', label: 'Free API' },
        { href: '/mpp/pull', label: 'Paid API' },
        { href: '/account', label: 'Account' },
    ];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900">
    <nav class="border-b border-gray-200 bg-white">
        <div class="mx-auto flex max-w-4xl items-center gap-8 px-6 py-4">
            <a href="/" class="text-lg font-semibold tracking-tight text-gray-900 no-underline">
                MPP Demo
            </a>
            <div class="flex gap-6">
                {#each navLinks as link (link.href)}
                    <a
                        href={link.href}
                        class="text-sm font-medium no-underline transition-colors {page.url
                            .pathname === link.href ||
                        (link.href !== '/' && page.url.pathname.startsWith(link.href))
                            ? 'text-indigo-600'
                            : 'text-gray-500 hover:text-gray-900'}"
                    >
                        {link.label}
                    </a>
                {/each}
            </div>
        </div>
    </nav>

    <main class="mx-auto max-w-4xl px-6 py-10">
        {@render children()}
    </main>
</div>
