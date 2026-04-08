<script lang="ts">
    import { user } from '$lib/state/UserState.svelte';
</script>

<div class="space-y-8">
    <div>
        <h1 class="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p class="mt-1 text-sm text-gray-500">
            Your Stellar testnet account is set up automatically when you first visit the app. Use
            this page to view your keys or reset your account.
        </p>
    </div>

    {#if user.keypair}
        <div class="space-y-3 rounded-lg border border-gray-200 bg-white p-5">
            <h2 class="text-sm font-semibold text-gray-700">Your Keypair</h2>
            <div class="space-y-2 text-sm">
                <div>
                    <span class="text-gray-500">Public key</span>
                    <code class="code">{user.keypair.publicKey()}</code>
                </div>
                <div>
                    <span class="text-gray-500">Secret key</span>
                    <code class="code">{user.keypair.secret()}</code>
                </div>
            </div>
        </div>
    {/if}

    <div class="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <h2 class="text-sm font-semibold text-gray-700">Setup Progress</h2>

        <ol class="space-y-3">
            {#each user.steps as step, i (step.label)}
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

    {#if user.isComplete}
        <div
            class="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"
        >
            <p class="font-semibold">One more step: Get (more) testnet USDC</p>
            <p>
                Your account is funded, has a USDC trustline, and we've even used a path payment to
                get you a small amount of USDC to start. You can still visit the official Circle
                faucet to airdrop more testnet USDC to your account, if you want:
            </p>
            <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-block font-medium text-blue-900 underline"
            >
                faucet.circle.com &rarr;
            </a>
            <p class="text-xs text-blue-600">
                Select <strong>Stellar Testnet</strong> as the network and paste your public key.
            </p>
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
