import { RpcProvider, RpcRotator } from '..';

async function checkConnection(rpcProvider) {
    const result = await rpcProvider.sendJsonRpc('gas_price', [null]);

    expect(result.gas_price).toBeTruthy();
}

test('passing url should work (deprecated method)', async () => {
    const rpcProvider = new RpcProvider('https://rpc.mainnet.near.org/');

    await checkConnection(rpcProvider);
});

test('wrong url should throw error (deprecated method)', async () => {
    const rpcProvider = new RpcProvider('https://wrong-url.com/');

    try {
        await rpcProvider.sendJsonRpc('gas_price', [null]);

        expect(true).toBe(false);
    } catch (err) {
        expect(err.type).toBe('RetriesExceeded');
    }
});

test('passing ConnectionInfo should work (original method)', async () => {
    const rpcProvider = new RpcProvider({ url: 'https://rpc.mainnet.near.org/' });

    await checkConnection(rpcProvider);
});

test('wrong ConnectionInfo should throw error (original method)', async () => {
    const rpcProvider = new RpcProvider({ url: 'https://wrong-url.com/' }, undefined, {
        attempt: 2,
        wait: 100,
        waitExponentialBackoff: 1.2,
    });

    try {
        await rpcProvider.sendJsonRpc('gas_price', [null]);

        expect(true).toBe(false);
    } catch (err) {
        expect(err.type).toBe('RetriesExceeded');
    }
});

test('first parameter is not important when valid RpcRotator is passed into it (new method)', async () => {
    const rpcProvider = new RpcProvider(
        { url: 'https://wrong-url.com' },
        new RpcRotator([
            {
                id: 'custom',
                data: {
                    url: 'https://rpc.mainnet.near.org/',
                },
            },
        ])
    );

    await checkConnection(rpcProvider);
});

test('wrong RPC details should work as long as there is at least one correct (new method)', async () => {
    const rpcProvider = new RpcProvider(
        { url: 'https://wrong-url.com' },
        new RpcRotator([
            {
                id: 'custom',
                data: {
                    url: 'https://wrong-url.com/',
                },
            },
            {
                id: 'custom',
                data: {
                    url: 'https://google.com/',
                },
            },
            {
                id: 'pagoda',
                data: {
                    apiKey: 'wrong-api-key',
                },
            },
            {
                id: 'custom',
                data: {
                    url: 'https://rpc.mainnet.near.org/',
                },
            },
        ])
    );

    await checkConnection(rpcProvider);
});

test('wrong methods / params will not throw error instead of keeping on retry (new method)', async () => {
    const rpcProvider = new RpcProvider(
        { url: 'https://wrong-url.com' },
        new RpcRotator([
            {
                id: 'custom',
                data: {
                    url: 'https://rpc.mainnet.near.org/',
                },
            },
            {
                id: 'custom',
                data: {
                    url: 'https://wrong-url.com/',
                },
            },
        ])
    );

    try {
        await rpcProvider.sendJsonRpc('gas_price', []);

        expect(true).toBe(false);
    } catch (err) {
        expect(err.type).not.toBe('RetriesExceeded');
    }
});
