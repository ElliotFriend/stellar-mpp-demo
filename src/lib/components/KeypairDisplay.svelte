<script lang="ts">
    import { user } from '$lib/state/UserState.svelte';
</script>

<div>
    <h1 class="text-2xl font-bold tracking-tight">Account Settings</h1>
    <p class="mt-1 text-sm text-gray-500">
        Your Stellar testnet account is set up automatically when you first visit the app. Use this
        page to view your keys or reset your account.
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
