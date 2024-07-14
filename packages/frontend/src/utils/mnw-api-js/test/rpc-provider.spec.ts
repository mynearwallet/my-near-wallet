import { expect, test } from '@jest/globals';

import { RpcProvider } from '..';

async function checkConnection(rpcProvider) {
    const result = await rpcProvider.sendJsonRpc('gas_price', [null]);

    expect(result.gas_price).toBeTruthy();
}

test(
    'passing url should work (deprecated method)',
    async () => {
        const rpcProvider = new RpcProvider('https://rpc.mainnet.near.org/');

        await checkConnection(rpcProvider);
    },
    30 * 1000
);

test(
    'passing ConnectionInfo should work (original method)',
    async () => {
        const rpcProvider = new RpcProvider({ url: 'https://rpc.mainnet.near.org/' });

        await checkConnection(rpcProvider);
    },
    30 * 1000
);
