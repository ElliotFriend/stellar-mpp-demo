<script lang="ts">
    import { page } from '$app/state';
    import { resolve } from '$app/paths';
    import { user } from '$lib/state/UserState.svelte';

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/free', label: 'Free API' },
        { href: '/mpp', label: 'Paid API' },
        { href: '/chat', label: 'Agent Demo' },
    ] as const;
</script>

<header class="border-b border-gray-200 bg-white">
    <nav>
        <div class="mx-auto flex max-w-4xl items-center gap-8 px-6 py-4">
            <a
                href={resolve('/')}
                class="text-lg font-semibold tracking-tight text-gray-900 no-underline"
            >
                MPP Demo
            </a>
            <div class="flex gap-6">
                {#each navLinks as link (link.href)}
                    <a
                        href={resolve(link.href)}
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
            <div class="ml-auto flex gap-6">
                {#if user.publicKey}
                    <span class="text-sm font-medium text-gray-500"
                        ><code
                            >{user.publicKey.slice(0, 4)}...{user.publicKey.slice(
                                user.publicKey.length - 4,
                            )}</code
                        ></span
                    >
                {/if}
                <a
                    href={resolve('/account')}
                    class="text-sm font-medium no-underline transition-colors {page.url.pathname.startsWith(
                        '/account',
                    )
                        ? 'text-indigo-600'
                        : 'text-gray-500 hover:text-gray-900'}"
                >
                    Account
                </a>
            </div>
        </div>
    </nav>
</header>
