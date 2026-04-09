<script lang="ts">
    import { user } from '$lib/state/UserState.svelte';
    import { Keypair } from '@stellar/stellar-sdk';
    import { Mppx } from 'mppx/client';
    import { Receipt } from 'mppx';
    import { stellar } from '@stellar/mpp/charge/client';

    import AccountRequired from '$lib/components/AccountRequired.svelte';
    import MppModeToggle from '$lib/components/ui/MppModeToggle.svelte';

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
        link?: { href: string; text: string };
        ts: number;
    }

    let endpoint = $state<'quotes' | 'recipes' | 'posts'>('quotes');
    let sponsored = $state(true);
    let flowSteps: FlowStep[] = $state([]);
    let resultData: unknown[] = $state([]);
    let isLoading = $state(false);
    let hasAccount = $derived(!!user.secretKey);

    const PAGE_SIZE = 6;
    let currentPage = $state(0);
    let totalPages = $derived(Math.ceil(resultData.length / PAGE_SIZE));
    let pagedData = $derived(
        resultData.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    );

    function addStep(
        kind: StepKind,
        label: string,
        detail?: string,
        link?: { href: string; text: string },
    ) {
        flowSteps.push({ kind, label, detail, link, ts: Date.now() });
    }

    async function makeRequest() {
        flowSteps = [];
        resultData = [];
        currentPage = 0;
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

        const params = !sponsored && mppMode === 'pull' ? '?sponsored=false' : '';
        const url = `/api/paid/${mppMode}/${endpoint}${params}`;
        addStep('request', `GET ${url}`);

        try {
            const res = await mppx.fetch(url);
            addStep('settling', 'Server verifying & settling payment');

            const receiptRaw = res.headers.get('payment-receipt') ?? '';
            if (receiptRaw) {
                try {
                    const receipt = Receipt.deserialize(receiptRaw);
                    const txHash = receipt.reference;
                    addStep('receipt', 'Payment settled', `tx: ${txHash.slice(0, 12)}...`, {
                        href: `https://stellar.expert/explorer/testnet/tx/${txHash}`,
                        text: 'View on Stellar Expert',
                    });
                } catch {
                    addStep('receipt', 'Payment receipt received', receiptRaw.slice(0, 60) + '...');
                }
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
    <div class="mb-4">
        <div class="flex items-start justify-between">
            <div>
                <div class="text-sm font-medium text-amber-600">Paid Endpoint</div>
                <h1 class="text-2xl font-bold tracking-tight">Paid API Demo</h1>
            </div>
            <MppModeToggle bind:mode={mppMode} />
        </div>
        <p class="mt-1 text-sm text-gray-500">
            Request a paid resource and watch the MPP protocol in action. The server returns HTTP
            402, the client signs a Stellar payment, and the server settles it before delivering the
            data.
        </p>
    </div>

    {#if !hasAccount}
        <AccountRequired />
    {:else}
        <div class="flex flex-wrap items-center gap-4">
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

            {#if mppMode === 'pull'}
                <label
                    class="flex items-center gap-2 text-sm text-gray-700"
                    title="When enabled, the server pays Stellar network fees on behalf of the client. When disabled, the client includes fees in its own transaction."
                >
                    <input
                        type="checkbox"
                        bind:checked={sponsored}
                        class="rounded border-gray-300 text-indigo-600"
                    />
                    Sponsor fees
                </label>
            {/if}

            <button
                onclick={makeRequest}
                disabled={isLoading}
                class="ml-auto w-36 rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isLoading ? 'Processing...' : 'Fetch Resource'}
            </button>
        </div>
        <hr />

        {#if flowSteps.length > 0}
            <div class="rounded-lg border border-gray-200 bg-white p-5">
                <h2 class="mb-4 text-sm font-semibold text-gray-700">Protocol Flow</h2>
                <ol class="space-y-3">
                    {#each flowSteps as step, i (`stepKey${i}`)}
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
                                {#if step.link}
                                    <a
                                        href={step.link.href}
                                        target="_blank"
                                        rel="external noopener noreferrer"
                                        class="mt-0.5 inline-block text-xs font-medium text-indigo-600 underline"
                                    >
                                        {step.link.text} &rarr;
                                    </a>
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
                        {#each pagedData as item, i (currentPage * PAGE_SIZE + i)}
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
                        {#each pagedData as item, i (currentPage * PAGE_SIZE + i)}
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
                        {#each pagedData as item, i (currentPage * PAGE_SIZE + i)}
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
                </div>
                {#if totalPages > 1}
                    <div class="flex items-center justify-between pt-2">
                        <button
                            onclick={() => currentPage--}
                            disabled={currentPage === 0}
                            class="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            &larr; Previous
                        </button>
                        <span class="text-sm text-gray-500">
                            Page {currentPage + 1} of {totalPages}
                        </span>
                        <button
                            onclick={() => currentPage++}
                            disabled={currentPage >= totalPages - 1}
                            class="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next &rarr;
                        </button>
                    </div>
                {/if}
            </div>
        {/if}
    {/if}
</div>
