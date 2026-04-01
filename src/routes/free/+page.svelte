<script lang="ts">
    interface Post {
        id: number;
        title: string;
        body: string;
        tags: string[];
        reactions: { likes: number; dislikes: number };
        views: number;
    }

    type FlowStep = { label: string; ts?: number };

    let posts: Post[] = $state([]);
    let flowSteps: FlowStep[] = $state([]);
    let isLoading = $state(false);
    let error = $state('');

    async function fetchPosts() {
        posts = [];
        error = '';
        flowSteps = [];
        isLoading = true;

        flowSteps.push({ label: 'GET /api/free/posts', ts: Date.now() });

        try {
            const res = await fetch('/api/free/posts');
            flowSteps.push({ label: `Response: ${res.status} ${res.statusText}`, ts: Date.now() });

            if (!res.ok) {
                error = `HTTP ${res.status}`;
                return;
            }

            posts = await res.json();
            flowSteps.push({ label: `Received ${posts.length} posts`, ts: Date.now() });
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
            This endpoint requires no payment. Click below to fetch posts from the free API.
        </p>
    </div>

    <button
        onclick={fetchPosts}
        disabled={isLoading}
        class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
        {isLoading ? 'Fetching...' : 'Fetch Posts'}
    </button>

    {#if flowSteps.length > 0}
        <div class="rounded-lg border border-gray-200 bg-white p-5">
            <h2 class="mb-3 text-sm font-semibold text-gray-700">Request Flow</h2>
            <ol class="space-y-2">
                {#each flowSteps as step, i (step.label)}
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

    {#if posts.length > 0}
        <div class="space-y-3">
            <h2 class="text-sm font-semibold text-gray-700">Results ({posts.length} posts)</h2>
            <div class="grid gap-3">
                {#each posts.slice(0, 6) as post (post.id)}
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
            </div>
            {#if posts.length > 6}
                <p class="text-xs text-gray-400">Showing 6 of {posts.length} posts</p>
            {/if}
        </div>
    {/if}
</div>
