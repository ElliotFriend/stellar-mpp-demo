<script lang="ts">
    type Endpoint = 'quote' | 'recipe' | 'post' | 'random';

    interface FlowStep {
        label: string;
        ts: number;
    }

    let endpoint = $state<Endpoint>('quote');
    let result: unknown = $state(null);
    let flowSteps: FlowStep[] = $state([]);
    let isLoading = $state(false);
    let error = $state('');

    async function fetchResource() {
        result = null;
        error = '';
        flowSteps = [];
        isLoading = true;

        const url = `/api/free/${endpoint}`;
        flowSteps.push({ label: `GET ${url}`, ts: Date.now() });

        try {
            const res = await fetch(url);
            flowSteps.push({ label: `Response: ${res.status} ${res.statusText}`, ts: Date.now() });

            if (!res.ok) {
                error = `HTTP ${res.status}`;
                return;
            }

            result = await res.json();
            const count = Array.isArray(result) ? `${result.length} items` : '1 item';
            flowSteps.push({ label: `Received ${count}`, ts: Date.now() });
        } catch (err) {
            error = err instanceof Error ? err.message : 'Request failed';
            flowSteps.push({ label: `Error: ${error}`, ts: Date.now() });
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="space-y-8">
    <div>
        <div class="text-sm font-medium text-green-600">Free Endpoint</div>
        <h1 class="text-2xl font-bold tracking-tight">Free API Demo</h1>
        <p class="mt-1 text-sm text-gray-500">
            These endpoints require no payment. Pick a resource and fetch it directly.
        </p>
    </div>

    <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
            <label for="endpoint-select" class="text-sm font-medium text-gray-700">Endpoint</label>
            <select
                id="endpoint-select"
                bind:value={endpoint}
                class="rounded-md border-gray-300 text-sm"
            >
                <option value="quote">Random Quote</option>
                <option value="recipe">Random Recipe</option>
                <option value="post">Random Post</option>
                <option value="random">Random Numbers</option>
            </select>
        </div>

        <button
            onclick={fetchResource}
            disabled={isLoading}
            class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {isLoading ? 'Fetching...' : 'Fetch Resource'}
        </button>
    </div>

    {#if flowSteps.length > 0}
        <div class="rounded-lg border border-gray-200 bg-white p-5">
            <h2 class="mb-3 text-sm font-semibold text-gray-700">Request Flow</h2>
            <ol class="space-y-2">
                {#each flowSteps as step, i (`stepKey${i}`)}
                    <li class="flex items-start gap-3">
                        <span
                            class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700"
                        >
                            {i + 1}
                        </span>
                        <div class="text-sm">
                            <code class="text-gray-800">{step.label}</code>
                        </div>
                    </li>
                {/each}
                {#if isLoading}
                    <li class="flex items-start gap-3">
                        <span
                            class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100"
                        >
                            <span
                                class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
                            ></span>
                        </span>
                        <span class="text-sm text-gray-500">Waiting for response...</span>
                    </li>
                {/if}
            </ol>
        </div>
    {/if}

    {#if error}
        <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
        </div>
    {/if}

    {#if result}
        <div class="space-y-3">
            <h2 class="text-sm font-semibold text-gray-700">Result</h2>
            <div class="grid gap-3">
                {#if endpoint === 'quote'}
                    {@const quote = result as { id: number; quote: string; author: string }}
                    <div class="rounded-lg border border-gray-200 bg-white p-4">
                        <blockquote class="text-sm text-gray-700 italic">
                            "{quote.quote}"
                        </blockquote>
                        <div class="mt-2 text-xs font-medium text-gray-500">
                            &mdash; {quote.author}
                        </div>
                    </div>
                {:else if endpoint === 'recipe'}
                    {@const recipe = result as {
                        id: number;
                        name: string;
                        difficulty: string;
                        cuisine: string;
                        ingredients: string[];
                        instructions: string[];
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
                            <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
                        </div>
                        <div class="mt-3">
                            <div class="mb-1 text-xs font-medium text-gray-500">Ingredients</div>
                            <div class="flex flex-wrap gap-1">
                                {#each recipe.ingredients as ingredient (ingredient)}
                                    <span
                                        class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                                        >{ingredient}</span
                                    >
                                {/each}
                            </div>
                        </div>
                        <div class="mt-3">
                            <div class="mb-1 text-xs font-medium text-gray-500">Instructions</div>
                            <ol class="list-inside list-decimal space-y-1 text-sm text-gray-700">
                                {#each recipe.instructions as step (step)}
                                    <li>{step}</li>
                                {/each}
                            </ol>
                        </div>
                    </div>
                {:else if endpoint === 'post'}
                    {@const post = result as {
                        id: number;
                        title: string;
                        body: string;
                        tags: string[];
                    }}
                    <div class="rounded-lg border border-gray-200 bg-white p-4">
                        <h3 class="font-medium text-gray-900">{post.title}</h3>
                        <p class="mt-1 text-sm text-gray-500">{post.body}</p>
                        <div class="mt-2 flex gap-2">
                            {#each post.tags as tag (tag)}
                                <span
                                    class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                                    >{tag}</span
                                >
                            {/each}
                        </div>
                    </div>
                {:else}
                    {@const data = result as {
                        count: number;
                        sum: number;
                        numbers: { value: number; hex: string; isEven: boolean }[];
                    }}
                    <div class="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                        <div class="flex gap-4 text-sm text-gray-500">
                            <span>Count: <strong class="text-gray-900">{data.count}</strong></span>
                            <span>Sum: <strong class="text-gray-900">{data.sum}</strong></span>
                        </div>
                        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {#each data.numbers as num (num.hex)}
                                <div
                                    class="rounded border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
                                >
                                    <span class="font-mono font-medium text-gray-900"
                                        >{num.value}</span
                                    >
                                    <span class="ml-2 text-xs text-gray-400">{num.hex}</span>
                                    <span
                                        class="ml-1 rounded-full px-1.5 py-0.5 text-xs {num.isEven
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-amber-100 text-amber-700'}"
                                    >
                                        {num.isEven ? 'even' : 'odd'}
                                    </span>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>
