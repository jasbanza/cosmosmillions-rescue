
// utils.js
import { CHAIN_CONFIG } from './config';

export async function getDeposits(address) {
    const response = await fetch(`${CHAIN_CONFIG.restEndpoint}/cosmos/cosmosmillions/millions/v1/deposits/${address}`);
    const data = await response.json();

    return data.deposits || [];
}

export async function withdraw(depositId, address, amount) {
    const msg = {
        typeUrl: '/cosmos.millions.v1.MsgWithdraw',
        value: {
            depositor: address,
            depositId,
            amount,
        },
    };

    return msg;
}

export async function broadcastTx(signerAddress, msgs, fee) {
    const client = await KeplrWalletClient.connect(CHAIN_CONFIG.chainId);
    const account = await client.getAccount(signerAddress);

    const txBody = {
        type: 'cosmos-sdk/MsgService',
        value: {
            msgs,
            fee,
            memo: '',
            timeout_height: '0',
        },
    };

    const signBytes = txBody.toSign();
    const signature = await client.sign(signerAddress, signBytes);

    const broadcastTx = {
        txBody,
        authInfoBytes: Buffer.from(JSON.stringify({
            signerInfos: [{
                publicKey: account.pubKey,
                sequence: account.sequence,
            }],
            fee: {
                amount: fee.amount,
                gas: fee.gas.toString(),
            },
        })),
        signatures: [signature.signature],
    };

    const response = await fetch(`${CHAIN_CONFIG.rpcEndpoint}/txs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            tx: broadcastTx,
            mode: 'BROADCAST_MODE_BLOCK',
        }),
    });

    return await response.json();
}