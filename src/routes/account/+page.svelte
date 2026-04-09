<script lang="ts">
    import BalanceBox from '$lib/components/BalanceBox.svelte';
    import KeypairDisplay from '$lib/components/KeypairDisplay.svelte';
    import USDCFaucetBox from '$lib/components/USDCFaucetBox.svelte';
    import { user } from '$lib/state/UserState.svelte';
    import type { PageProps } from './$types';
    let { data }: PageProps = $props();
</script>

<div class="space-y-8">
    <KeypairDisplay />

    {#if user.alreadySetUp}
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Account Balances</h2>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {#if data.balances?.length}
                {#each data.balances as { token, balance }, i (`token${i}`)}
                    <BalanceBox {token} {balance} />
                {/each}
            {/if}
            <USDCFaucetBox />
        </div>
    {:else}
        <div class="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
            <h2 class="text-sm font-semibold text-gray-700">Setup Progress</h2>

            <ol class="space-y-3">
                {#each Object.values(user.steps) as step, i (step.label)}
                    <li class="flex items-start gap-3">
                        <span
                            class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold
                            {step.status === 'done'
                                ? 'bg-green-100 text-green-700'
                                : step.status === 'active'
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : step.status === 'error'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-400'}"
                        >
                            {#if step.status === 'done'}
                                &#10003;
                            {:else if step.status === 'error'}
                                !
                            {:else if step.status === 'active'}
                                <span
                                    class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
                                ></span>
                            {:else}
                                {i + 1}
                            {/if}
                        </span>
                        <div>
                            <div class="text-sm font-medium text-gray-900">{step.label}</div>
                            {#if step.detail}
                                <div
                                    class="text-xs {step.status === 'error'
                                        ? 'text-red-600'
                                        : 'text-gray-500'}"
                                >
                                    {step.detail}
                                </div>
                            {/if}
                        </div>
                    </li>
                {/each}
            </ol>

            {#if !user.isComplete && !user.isLoading}
                <button
                    onclick={user.setup}
                    class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                    {#if user.keypair}
                        Retry Setup
                    {:else}
                        Setup Account
                    {/if}
                </button>
            {/if}
        </div>
    {/if}

    {#if user.keypair}
        <div class="border-t border-gray-200 pt-4">
            <button
                onclick={user.reset}
                class="text-sm text-red-600 transition-colors hover:text-red-800"
            >
                Reset account
            </button>
        </div>
    {/if}
</div>
