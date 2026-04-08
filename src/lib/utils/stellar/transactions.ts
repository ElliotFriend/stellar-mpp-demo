import { Asset, TransactionBuilder, Networks, Operation } from '@stellar/stellar-sdk';
import { Server } from '@stellar/stellar-sdk/rpc';

export async function makeTrustlineTransaction(
    publicKey: string,
    asset: Asset,
    server: Server,
): Promise<TransactionBuilder> {
    const account = await server.getAccount(publicKey);
    const tx = new TransactionBuilder(account, {
        fee: '1000',
        networkPassphrase: Networks.TESTNET,
    })
        .addOperation(
            Operation.changeTrust({
                asset,
            }),
        )
        .setTimeout(60);

    return tx;
}
