import type { RequestHandler } from './$types';

import { json, error } from '@sveltejs/kit';
import { TransactionBuilder, Networks } from '@stellar/stellar-sdk';
import { Server, Api } from '@stellar/stellar-sdk/rpc';

export const POST: RequestHandler = async ({ request }) => {
    const { signedXdr }: { signedXdr: string } = await request.json();

    if (!signedXdr) {
        error(400, { message: 'Missing transaction' });
    }

    // submit the signed trustline transaction
    const server = new Server('https://soroban-testnet.stellar.org');

    try {
        const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
        const response = await server.sendTransaction(tx);
        const result = await server.pollTransaction(response.hash);

        if (result.status !== Api.GetTransactionStatus.SUCCESS) {
            console.error(
                `Error adding USDC trustline. txStatus: ${result.status}. txHash: ${response.hash}`,
            );
            error(500, { message: `Error adding USDC trustline. Status: ${result.status}` });
        }

        return json({
            success: true,
            txHahs: result.txHash,
        });
    } catch (err: unknown) {
        console.error('Error sending transaction. Error:', JSON.stringify(err));
        error(500, { message: 'Error sending transaction' });
    }
};
