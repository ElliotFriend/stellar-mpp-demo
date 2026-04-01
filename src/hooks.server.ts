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

// Initialize the MPP server
const mppx = Mppx.create({
    secretKey: MPP_SECRET_KEY,
    methods: [
        stellar.charge({
            recipient: STELLAR_RECIPIENT,
            currency: USDC_SAC_TESTNET,
            network: 'stellar:testnet',
            feePayer: {
                envelopeSigner: Keypair.fromSecret(ENVELOPE_SIGNER_SECRET),
                feeBumpSigner: Keypair.fromSecret(FEE_PAYER_SECRET),
            },
        }),
    ],
});

export const handle: Handle = async ({ event, resolve }) => {
    // Before anything else, make sure it's a paid endpoint
    const isPaidPath = event.url.pathname.startsWith('/api/paid');

    if (isPaidPath) {
        // First, route to the appropriate MPP mode
        const isPullMode = event.url.pathname.startsWith('/api/paid/pull');
        const isPushMode = event.url.pathname.startsWith('/api/paid/push');

        if (isPullMode || isPushMode) {
            const result = await mppx.charge({
                amount: '0.025',
                description: 'Eff you, pay me!',
            })(event.request);

            if (result.status === 402) {
                // console.log('we are here in 402-land')
                return result.challenge;
            }

            // console.log('do i get seen?')
            // console.log(result.status)

            const response = await resolve(event);
            return result.withReceipt(response);
            // const mode = isPushMode ? 'push' : 'pull';

            // do some Node.js to Web Request conversion
            // const headers = new Headers();
            // for (const [key, value] of Object.entries(event.request.headers)) {
            //     if (value == null) continue;
            //     if (Array.isArray(value)) {
            //         for (const entry of value) {
            //             headers.append(key, entry);
            //         }
            //     } else {
            //         headers.set(key, value);
            //     }
            // }
            // const authHeader = event.request.headers.get('Authorization')

            // // auth header doesn't exist, issue a challenge
            // if (!authHeader || !authHeader.startsWith('Payment ')) {
            //     // const webReq = new Request(event.url, {
            //     //     method: event.request.method,

            //     // })
            //     const result = await mppx.charge({
            //         amount: "0.01",
            //         description: "Paid API Access",
            //     })(event.request);

            //     if (result.status === 402) {
            //         return result.challenge
            //     }

            //     // return result.withReceipt(await resolve(event))
            // } else {
            //     // verify and stuff, i think?

            // }
        }
    }

    const response = await resolve(event);
    return response;
};
