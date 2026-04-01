<script lang="ts">
    import { user } from '$lib/state/UserState.svelte';
    import { Keypair, Networks, TransactionBuilder } from '@stellar/stellar-sdk';
    import { onMount } from 'svelte';

    let kp: Keypair | undefined = $state();

    onMount(() => {
        if (user.secretKey) {
            kp = Keypair.fromSecret(user.secretKey);
        }
    });

    type StepStatus = 'idle' | 'active' | 'done' | 'error';

    let steps: { label: string; status: StepStatus; detail: string }[] = $state([
        { label: 'Generate keypair', status: 'idle', detail: '' },
        { label: 'Fund with Friendbot', status: 'idle', detail: '' },
        { label: 'Create USDC trustline', status: 'idle', detail: '' },
    ]);

    let isLoading = $derived(steps.some((s) => s.status === 'active'));
    let isComplete = $derived(steps.every((s) => s.status === 'done'));

    function setStep(index: number, status: StepStatus, detail = '') {
        steps[index] = { ...steps[index], status, detail };
    }

    async function setupAccount() {
        // Step 1: Generate keypair
        setStep(0, 'active', 'Generating...');
        if (!user.secretKey) {
            kp = Keypair.random();
            user.set({ publicKey: kp.publicKey(), secretKey: kp.secret() });
        } else {
            kp = Keypair.fromSecret(user.secretKey);
        }
        setStep(0, 'done', kp.publicKey().slice(0, 8) + '...');

        // Step 2: Friendbot
        setStep(1, 'active', 'Requesting testnet XLM...');
        try {
            const res = await fetch('/api/faucet?step=friendbot', {
                method: 'POST',
                body: JSON.stringify({ publicKey: kp.publicKey() }),
            });
            if (!res.ok) throw new Error('Friendbot request failed');
            const data = await res.json();
            setStep(1, 'done', `Funded (tx: ${data.hash?.slice(0, 8)}...)`);
        } catch (err) {
            setStep(1, 'error', err instanceof Error ? err.message : 'Failed');
            return;
        }

        // Step 3: Trustline
        setStep(2, 'active', 'Building trustline transaction...');
        try {
            const res = await fetch('/api/faucet?step=trustline', {
                method: 'POST',
                body: JSON.stringify({ publicKey: kp.publicKey() }),
            });
            if (!res.ok) throw new Error('Trustline build failed');
            const { txXdr } = await res.json();

            setStep(2, 'active', 'Signing and submitting...');
            const tx = TransactionBuilder.fromXDR(txXdr, Networks.TESTNET);
            tx.sign(kp);

            const submitRes = await fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify({ signedXdr: tx.toXDR() }),
            });
            if (!submitRes.ok) throw new Error('Transaction submission failed');
            setStep(2, 'done', 'USDC trustline active');
        } catch (err) {
            setStep(2, 'error', err instanceof Error ? err.message : 'Failed');
        }
    }
</script>

<div class="space-y-8">
    <div>
        <h1 class="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p class="mt-1 text-sm text-gray-500">
            Set up a Stellar testnet account to use the paid API demos.
        </p>
    </div>

    {#if kp}
        <div class="space-y-3 rounded-lg border border-gray-200 bg-white p-5">
            <h2 class="text-sm font-semibold text-gray-700">Your Keypair</h2>
            <div class="space-y-2 text-sm">
                <div>
                    <span class="text-gray-500">Public key</span>
                    <code class="mt-0.5 block rounded bg-gray-50 px-3 py-2 text-xs break-all"
                        >{kp.publicKey()}</code
                    >
                </div>
                <div>
                    <span class="text-gray-500">Secret key</span>
                    <code class="mt-0.5 block rounded bg-gray-50 px-3 py-2 text-xs break-all"
                        >{kp.secret()}</code
                    >
                </div>
            </div>
        </div>
    {/if}

    <div class="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <h2 class="text-sm font-semibold text-gray-700">Setup Progress</h2>

        <ol class="space-y-3">
            {#each steps as step, i (step.label)}
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

        {#if !isComplete}
            <button
                onclick={setupAccount}
                disabled={isLoading}
                class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {#if isLoading}
                    Setting up...
                {:else if kp}
                    Retry Setup
                {:else}
                    Setup Account
                {/if}
            </button>
        {/if}
    </div>

    {#if isComplete}
        <div
            class="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"
        >
            <p class="font-semibold">One more step: Get testnet USDC</p>
            <p>
                Your account is funded and has a USDC trustline, but you still need USDC tokens to
                make payments. Visit the Circle faucet to airdrop testnet USDC to your account:
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
                Select <strong>Stellar</strong> as the network and paste your public key.
            </p>
        </div>
    {/if}

    {#if kp}
        <div class="border-t border-gray-200 pt-4">
            <button
                onclick={() => user.reset()}
                class="text-sm text-red-600 transition-colors hover:text-red-800"
            >
                Reset account
            </button>
        </div>
    {/if}
</div>
