<script lang="ts">
    import { user } from '$lib/state/UserState.svelte';
    import { resolve } from '$app/paths';

    import type { Demo } from '$lib/types';

    const demos: Demo[] = [
        {
            num: 1,
            paid: true,
            title: 'AI Agent Demo',
            link: '/chat',
            titleColor: 'purple',
            description:
                'Chat with an AI agent that decides when to use free or paid APIs, and autonomously handles Stellar payments on your behalf.',
        },
        {
            num: 2,
            paid: false,
            title: 'Free API Demo',
            link: '/free',
            titleColor: 'green',
            description:
                'Fetch resources from an open endpoint with no payment required. Start here to see the baseline experience before adding payments.',
        },
        {
            num: 3,
            paid: true,
            title: 'Paid API Demo',
            link: '/mpp',
            titleColor: 'amber',
            description:
                'Request a paid resource and watch the full MPP flow: 402 challenge, Stellar payment, receipt, and data delivery. Toggle between pull and push modes.',
        },
    ];
</script>

<div class="space-y-8">
    <div>
        <h1 class="text-3xl font-bold tracking-tight">Machine Payments Protocol</h1>
        <p class="mt-2 text-gray-600">
            This demo shows how APIs can charge for access using HTTP 402 and Stellar smart
            contracts. Try the demos below to see MPP in action on the Stellar testnet.
        </p>
    </div>

    {#if !user.publicKey}
        <div class="rounded-lg border border-indigo-200 bg-indigo-50 p-5">
            <h2 class="text-base font-semibold text-indigo-900">Get started</h2>
            <p class="mt-1 text-sm text-indigo-800">
                To try the paid demos, you'll need a Stellar testnet account with USDC. It only
                takes a few seconds to set one up.
            </p>
            <a
                href={resolve('/account')}
                class="mt-3 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white no-underline transition-colors hover:bg-indigo-700"
            >
                Set up your account
            </a>
            <p class="mt-3 text-sm text-indigo-700">
                Or, start with the <a
                    href={resolve('/free')}
                    class="font-medium text-indigo-900 underline">Free API demo</a
                > &mdash; no account needed.
            </p>
        </div>
    {:else}
        <div class="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            Your account is set up. Pick any demo below to get started.
        </div>
    {/if}

    <div>
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Demos</h2>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {#each demos as demo (demo.link)}
                {@render demoBlock(demo)}
            {/each}
        </div>
    </div>
</div>

{#snippet demoBlock(demo: Demo)}
    <a
        href={resolve(demo.link)}
        class="group block rounded-lg border border-gray-200 bg-white p-6 no-underline transition-shadow hover:shadow-md"
    >
        <div class={['text-sm font-medium', `text-${demo.titleColor}-600`]}>
            Step {demo.num} ({demo.paid ? 'payment required' : 'no payment needed'})
        </div>
        <h3 class="mt-1 text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
            {demo.title}
        </h3>
        <p class="mt-2 text-sm text-gray-500">
            {demo.description}
        </p>
    </a>
{/snippet}
