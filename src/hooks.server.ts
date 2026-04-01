import { type Handle } from '@sveltejs/kit';
import {
    MPP_SECRET_KEY,
    STELLAR_RECIPIENT,
    FEE_PAYER_SECRET,
    ENVELOPE_SIGNER_SECRET,
} from '$env/static/private';

import { Mppx, stellar } from '@stellar/mpp/charge/server';
import { USDC_SAC_TESTNET } from '@stellar/mpp';
import { Keypair } from '@stellar/stellar-sdk';

export const handle: Handle = async ({ event, resolve }) => {
    // Before anything else, make sure it's a paid endpoint
    const isPaidPath = event.url.pathname.startsWith('/api/paid');

    if (isPaidPath) {
        // First, route to the appropriate MPP mode
        const isPullMode = event.url.pathname.includes('pull');
        const isPushMode = event.url.pathname.includes('push');

        if (isPullMode || isPushMode) {
            let feePayer
            // figure out if we're sponsoring fees
            if (isPushMode) {
                feePayer = undefined;
            } else {
                feePayer = {
                    envelopeSigner: Keypair.fromSecret(ENVELOPE_SIGNER_SECRET),
                    feeBumpSigner: Keypair.fromSecret(FEE_PAYER_SECRET),
                }
            }
            // Initialize the MPP server
            const mppx = Mppx.create({
                secretKey: MPP_SECRET_KEY,
                methods: [
                    stellar.charge({
                        recipient: STELLAR_RECIPIENT,
                        currency: USDC_SAC_TESTNET,
                        network: 'stellar:testnet',
                        feePayer,
                    }),
                ],
            });

            const result = await mppx.charge({
                amount: '0.025',
                description: 'Eff you, pay me!',
            })(event.request);

            if (result.status === 402) {
                return result.challenge;
            }

            const response = await resolve(event);
            return result.withReceipt(response);
        }
    }

    const response = await resolve(event);
    return response;
};
