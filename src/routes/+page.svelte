<script lang="ts">
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
