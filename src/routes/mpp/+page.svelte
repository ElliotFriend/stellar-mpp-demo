<script lang="ts">
    import { user } from '$lib/state/UserState.svelte';
    import { Keypair } from '@stellar/stellar-sdk';
    import { Mppx } from 'mppx/client';
    import { stellar } from '@stellar/mpp/charge/client';
    import { resolve } from '$app/paths';

    let mppMode = $state<'pull' | 'push'>('pull');

    type StepKind =
        | 'request'
        | 'challenge'
        | 'signing'
        | 'signed'
        | 'settling'
        | 'receipt'
        | 'data'
        | 'error';
    interface FlowStep {
        kind: StepKind;
        label: string;
        detail?: string;
        ts: number;
    }

    let endpoint = $state<'quotes' | 'recipes' | 'posts'>('quotes');
    let flowSteps: FlowStep[] = $state([]);
    let resultData: unknown[] = $state([]);
    let receiptHeader = $state('');
    let isLoading = $state(false);
    let hasAccount = $derived(!!user.secretKey);

    function addStep(kind: StepKind, label: string, detail?: string) {
        flowSteps.push({ kind, label, detail, ts: Date.now() });
    }

    async function makeRequest() {
        flowSteps = [];
        resultData = [];
        receiptHeader = '';
        isLoading = true;

        if (!user.secretKey) return;
        const keypair = Keypair.fromSecret(user.secretKey);

        const mppx = Mppx.create({
            polyfill: false,
            methods: [
                stellar.charge({
                    keypair,
                    mode: mppMode,
                    onProgress(event) {
                        switch (event.type) {
                            case 'challenge':
                                addStep(
                                    'challenge',
                                    '402 Payment Required',
                                    `${event.amount} USDC to ${event.recipient.slice(0, 8)}...`,
                                );
                                break;
                            case 'signing':
                                addStep('signing', 'Signing authorization entries');
                                break;
                            case 'signed':
                                addStep(
                                    'signed',
                                    'Transaction signed',
                                    `XDR: ${event.transaction.slice(0, 32)}...`,
                                );
                                break;
                        }
                    },
                }),
            ],
        });

        const url = `/api/paid/${mppMode}/${endpoint}`;
        addStep('request', `GET ${url}`);

        try {
            const res = await mppx.fetch(url);
            addStep('settling', 'Server verifying & settling payment');

            receiptHeader = res.headers.get('x-payment-receipt') ?? '';
            if (receiptHeader) {
                addStep('receipt', 'Payment receipt received', receiptHeader.slice(0, 60) + '...');
            }

            if (!res.ok) {
                addStep('error', `Response: ${res.status}`, await res.text());
                return;
            }

            const data = await res.json();
            resultData = Array.isArray(data) ? data : [data];
            addStep('data', `Received ${resultData.length} items`);
        } catch (err) {
            addStep('error', 'Request failed', err instanceof Error ? err.message : String(err));
        } finally {
            isLoading = false;
        }
    }

    const stepStyles: Record<StepKind, string> = {
        request: 'bg-gray-100 text-gray-700',
        challenge: 'bg-amber-100 text-amber-700',
        signing: 'bg-indigo-100 text-indigo-700',
        signed: 'bg-indigo-100 text-indigo-700',
        settling: 'bg-purple-100 text-purple-700',
        receipt: 'bg-green-100 text-green-700',
        data: 'bg-green-100 text-green-700',
        error: 'bg-red-100 text-red-700',
    };
</script>

<div class="space-y-8">
    <div>
        <div class="text-sm font-medium text-amber-600">Paid Endpoint</div>
        <h1 class="text-2xl font-bold tracking-tight">Paid API Demo</h1>
        <p class="mt-1 text-sm text-gray-500">
            Request a paid resource and watch the MPP protocol in action. The server returns HTTP
            402, the client signs a Stellar payment, and the server settles it before delivering the
            data.
        </p>
    </div>

    {#if !hasAccount}
        <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You need a funded Stellar account with USDC to use this demo.
            <a href={resolve('/account')} class="font-medium text-amber-900 underline"
                >Set up your account</a
            > first.
        </div>
    {:else}
        <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-gray-700">Mode</span>
                <button
                    onclick={() => (mppMode = mppMode === 'pull' ? 'push' : 'pull')}
                    class="relative inline-flex h-7 w-[5.5rem] shrink-0 cursor-pointer items-center rounded-full border border-gray-300 bg-gray-100 transition-colors"
                    role="switch"
                    aria-checked={mppMode === 'push'}
                >
                    <span
                        class="absolute left-0.5 h-6 w-10 rounded-full bg-indigo-600 transition-transform {mppMode ===
                        'push'
                            ? 'translate-x-[calc(100%-0.125rem)]'
                            : ''}"
                    ></span>
                    <span
                        class="relative z-10 w-1/2 text-center text-xs font-medium transition-colors {mppMode ===
                        'pull'
                            ? 'text-white'
                            : 'text-gray-500'}"
                    >
                        Pull
                    </span>
                    <span
                        class="relative z-10 w-1/2 text-center text-xs font-medium transition-colors {mppMode ===
                        'push'
                            ? 'text-white'
                            : 'text-gray-500'}"
                    >
                        Push
                    </span>
                </button>
            </div>

            <div class="flex items-center gap-2">
                <label for="endpoint-select" class="text-sm font-medium text-gray-700"
                    >Endpoint</label
                >
                <select
                    id="endpoint-select"
                    bind:value={endpoint}
                    class="rounded-md border-gray-300 text-sm"
                >
                    <option value="quotes">Quotes</option>
                    <option value="recipes">Recipes</option>
                    <option value="posts">Posts</option>
                </select>
            </div>

            <button
                onclick={makeRequest}
                disabled={isLoading}
                class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isLoading ? 'Processing...' : 'Fetch Resource'}
            </button>
        </div>

        {#if flowSteps.length > 0}
            <div class="rounded-lg border border-gray-200 bg-white p-5">
                <h2 class="mb-4 text-sm font-semibold text-gray-700">Protocol Flow</h2>
                <ol class="space-y-3">
                    {#each flowSteps as step, i (step.ts)}
                        <li class="flex items-start gap-3">
                            <span
                                class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold {stepStyles[
                                    step.kind
                                ]}"
                            >
                                {i + 1}
                            </span>
                            <div class="min-w-0">
                                <div class="text-sm font-medium text-gray-900">{step.label}</div>
                                {#if step.detail}
                                    <div class="text-xs break-all text-gray-500">{step.detail}</div>
                                {/if}
                            </div>
                        </li>
                    {/each}
                    {#if isLoading}
                        <li class="flex items-start gap-3">
                            <span
                                class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100"
                            >
                                <span
                                    class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
                                ></span>
                            </span>
                            <span class="text-sm text-gray-500">Working...</span>
                        </li>
                    {/if}
                </ol>
            </div>
        {/if}

        {#if resultData.length > 0}
            <div class="space-y-3">
                <h2 class="text-sm font-semibold text-gray-700">
                    Results ({resultData.length} items)
                </h2>
                <div class="grid gap-3">
                    {#if endpoint === 'quotes'}
                        {#each resultData.slice(0, 6) as item, i (i)}
                            {@const quote = item as { id: number; quote: string; author: string }}
                            <div class="rounded-lg border border-gray-200 bg-white p-4">
                                <blockquote class="text-sm text-gray-700 italic">
                                    "{quote.quote}"
                                </blockquote>
                                <div class="mt-2 text-xs font-medium text-gray-500">
                                    &mdash; {quote.author}
                                </div>
                            </div>
                        {/each}
                    {:else if endpoint === 'recipes'}
                        {#each resultData.slice(0, 4) as item, i (i)}
                            {@const recipe = item as {
                                id: number;
                                name: string;
                                difficulty: string;
                                cuisine: string;
                                ingredients: string[];
                                prepTimeMinutes: number;
                                cookTimeMinutes: number;
                            }}
                            <div class="rounded-lg border border-gray-200 bg-white p-4">
                                <h3 class="font-medium text-gray-900">{recipe.name}</h3>
                                <div class="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                                    <span>{recipe.cuisine}</span>
                                    <span>&middot;</span>
                                    <span>{recipe.difficulty}</span>
                                    <span>&middot;</span>
                                    <span
                                        >{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span
                                    >
                                </div>
                                <div class="mt-2 flex flex-wrap gap-1">
                                    {#each recipe.ingredients.slice(0, 5) as ingredient (ingredient)}
                                        <span
                                            class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                                            >{ingredient}</span
                                        >
                                    {/each}
                                    {#if recipe.ingredients.length > 5}
                                        <span class="text-xs text-gray-400"
                                            >+{recipe.ingredients.length - 5} more</span
                                        >
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    {:else}
                        {#each resultData.slice(0, 6) as item, i (i)}
                            {@const post = item as {
                                id: number;
                                title: string;
                                body: string;
                                tags: string[];
                            }}
                            <div class="rounded-lg border border-gray-200 bg-white p-4">
                                <h3 class="font-medium text-gray-900">{post.title}</h3>
                                <p class="mt-1 line-clamp-2 text-sm text-gray-500">{post.body}</p>
                                <div class="mt-2 flex gap-2">
                                    {#each post.tags as tag (tag)}
                                        <span
                                            class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                                            >{tag}</span
                                        >
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    {/if}
                    {#if resultData.length > 6}
                        <p class="text-xs text-gray-400">
                            Showing 6 of {resultData.length} items
                        </p>
                    {/if}
                </div>
            </div>
        {/if}
    {/if}
</div>
