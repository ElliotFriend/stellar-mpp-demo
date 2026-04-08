<script lang="ts">
    import { user } from '$lib/state/UserState.svelte';
    import { onMount } from 'svelte';

    let dismissed = $state(false);

    onMount(() => {
        // Skip auto-setup for bots/crawlers that execute JS (e.g., Googlebot)
        if (
            navigator.webdriver ||
            /bot|crawl|spider|slurp|facebookexternalhit|vercel/i.test(
                navigator.userAgent,
            )
        )
            return;

        if (!user.alreadySetUp) {
            user.setup();
        }
    });

    // Hide the banner entirely if setup was already done on a prior visit and user dismissed it
    let visible = $derived(!dismissed && !user.alreadySetUp);
</script>

{#if visible}
    <div class="border-b border-gray-200 bg-white px-6 py-3">
        <div class="mx-auto flex max-w-4xl items-center gap-4">
            {#if user.isComplete}
                <div class="flex flex-1 items-center gap-3 text-sm text-green-700">
                    <span
                        class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700"
                        >&#10003;</span
                    >
                    <span>
                        Your testnet account is ready.
                        <button
                            onclick={() => (dismissed = true)}
                            class="ml-1 font-medium text-green-800 underline transition-colors hover:text-green-900"
                        >
                            Dismiss
                        </button>
                    </span>
                </div>
            {:else if user.hasError}
                <div class="flex flex-1 items-center gap-3 text-sm text-red-700">
                    <span
                        class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700"
                        >!</span
                    >
                    <span>
                        Account setup failed.
                        <button
                            onclick={user.setup}
                            class="ml-1 font-medium text-red-800 underline transition-colors hover:text-red-900"
                        >
                            Retry
                        </button>
                    </span>
                </div>
            {:else}
                <div class="flex flex-1 items-center gap-3 text-sm text-gray-600">
                    <span
                        class="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
                    ></span>
                    <span>
                        Setting up your testnet account...
                        {#each user.steps as step (step.label)}
                            {#if step.status === 'active'}
                                <span class="text-gray-500">{step.detail}</span>
                            {/if}
                        {/each}
                    </span>
                </div>
            {/if}

            {#if user.keypair}
                <button
                    onclick={user.reset}
                    class="shrink-0 text-xs text-gray-400 transition-colors hover:text-red-600"
                >
                    Reset account
                </button>
            {/if}
        </div>
    </div>
{/if}
