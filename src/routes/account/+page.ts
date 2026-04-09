import type { PageLoad } from './$types';
import { user } from '$lib/state/UserState.svelte';
import { Horizon } from '@stellar/stellar-sdk';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ depends }) => {
    if (user.publicKey) {
        try {
            const server = new Horizon.Server('https://horizon-testnet.stellar.org');
            const res = await server.accounts().accountId(user.publicKey).call();

            depends('fetch:account:balances');
            return {
                balances: res.balances
                    .filter((bal) => bal.asset_type !== 'liquidity_pool_shares')
                    .map((bal) => {
                        if (bal.asset_type === 'native') {
                            return {
                                token: 'XLM',
                                balance: bal.balance,
                            };
                        } else {
                            return {
                                token: bal.asset_code,
                                balance: bal.balance,
                            };
                        }
                    }),
            };
        } catch (err: unknown) {
            console.error('error fetching account', JSON.stringify(err));
            error(500, { message: `error fetching account ${user.publicKey}` });
        }
    }
};
