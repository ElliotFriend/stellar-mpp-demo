<script lang="ts">
    import { user } from '$lib/state/UserState.svelte';
    import { resolve } from '$app/paths';
</script>

<div class="space-y-8">
    <div>
        <h1 class="text-3xl font-bold tracking-tight">Machine Payments Protocol</h1>
        <p class="mt-2 text-gray-600">
            A demonstration of MPP interactions on the Stellar network. See how APIs can charge for
            access using HTTP 402 and Stellar smart contracts.
        </p>
    </div>

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <a
            href={resolve('/free')}
            class="group block rounded-lg border border-gray-200 bg-white p-6 no-underline transition-shadow hover:shadow-md"
        >
            <div class="text-sm font-medium text-green-600">Free</div>
            <h2 class="mt-1 text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                Free API Demo
            </h2>
            <p class="mt-2 text-sm text-gray-500">
                Fetch resources from an open endpoint &mdash; no payment required. See the baseline
                experience.
            </p>
        </a>

        <a
            href={resolve('/mpp')}
            class="group block rounded-lg border border-gray-200 bg-white p-6 no-underline transition-shadow hover:shadow-md"
        >
            <div class="text-sm font-medium text-amber-600">Paid</div>
            <h2 class="mt-1 text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                Paid API Demo
            </h2>
            <p class="mt-2 text-sm text-gray-500">
                Request a paid resource and watch the MPP flow: 402 challenge, Stellar payment,
                receipt, and data delivery.
            </p>
        </a>

        <a
            href={resolve('/chat')}
            class="group block rounded-lg border border-gray-200 bg-white p-6 no-underline transition-shadow hover:shadow-md"
        >
            <div class="text-sm font-medium text-purple-600">Agent</div>
            <h2 class="mt-1 text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                AI Chat Demo
            </h2>
            <p class="mt-2 text-sm text-gray-500">
                Chat with an AI agent that makes Stellar payments to fetch paid resources on your
                behalf.
            </p>
        </a>
    </div>

    {#if !user.publicKey}
        <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You need a Stellar account to use the paid demo.
            <a href={resolve('/account')} class="font-medium text-amber-900 underline"
                >Set up your account</a
            > first.
        </div>
    {/if}
</div>
