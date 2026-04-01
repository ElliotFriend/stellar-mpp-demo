<script lang="ts">
    // import type { PageProps } from './$types';
    // let { data }: PageProps = $props();

    import { user } from '$lib/state/UserState.svelte'

    import { Keypair, Networks, TransactionBuilder } from '@stellar/stellar-sdk';
    import { onMount } from 'svelte';

    let kp: Keypair | undefined = $state()
    onMount(() => {
        if (user.secretKey) {
            kp = Keypair.fromSecret(user.secretKey)
        }
    })

    let txXdr: string = $state("");
    let isFriendbotting: boolean = $state(false)
    let isTrustlining: boolean = $state(false)
    let isSubmitting: boolean = $state(false)
    let isLoading: boolean = $derived(isFriendbotting || isTrustlining || isSubmitting);

    async function createAccount() {
        if (!kp) return;
        try {
            isFriendbotting = true
            const res = await fetch("/api/faucet?step=friendbot", {
                method: "POST",
                body: JSON.stringify({
                    publicKey: kp.publicKey(),
                })
            })
            console.log('res', res)
        } catch (err) {
            console.error('err', err)
        } finally {
            isFriendbotting = false
        }
    }

    async function createTrustline() {
        if (!kp) return;
        try {
            isTrustlining = true
            const res = await fetch("/api/faucet?step=trustline", {
                method: "POST",
                body: JSON.stringify({
                    publicKey: kp.publicKey(),
                })
            })
            const resJson = await res.json();
            console.log('res', resJson)

            const tx = TransactionBuilder.fromXDR(resJson.txXdr, Networks.TESTNET)
            tx.sign(kp)
            txXdr = tx.toXDR();

            await submitTransaction()
        } catch (err) {
            console.error('err', err)
        } finally {
            isTrustlining = false
        }
    }

    async function submitTransaction() {
        if (!kp) return;
        try {
            isSubmitting = true
            const res = await fetch("/api/transaction", {
                method: "POST",
                body: JSON.stringify({
                    signedXdr: txXdr,
                })
            })
            const resJson = await res.json();
            console.log('res', resJson)
        } catch (err) {
            console.error('err', err)
        } finally {
            isSubmitting = false
        }
    }

    async function setupAccount() {
        if (!user.secretKey) {
            kp = Keypair.random()
            user.set({
                publicKey: kp.publicKey(),
                secretKey: kp.secret(),
            })
        }
        await createAccount()
        await createTrustline()
    }
</script>

<h1>Account Settings</h1>
<p>Your public key: <code>{kp?.publicKey()}</code></p>
<p>Your secret key: <code>{kp?.secret()}</code></p>

<div>
    <button onclick={setupAccount} disabled={isLoading}>
        {#if isLoading}
            (spinner)
        {/if}
        Setup Account
    </button>
</div>
