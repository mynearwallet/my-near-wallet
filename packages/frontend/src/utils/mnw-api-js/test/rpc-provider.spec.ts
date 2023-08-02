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
        const result = await rpcProvider.sendJsonRpc('gas_price', [null]);

        expect(result).toBeUndefined();
    } catch (err) {
        expect(err.type).toBe('RetriesExceeded');
    }
});

test('passing ConnectionInfo should work (original method)', async () => {
    const rpcProvider = new RpcProvider({ url: 'https://rpc.mainnet.near.org/' });

    await checkConnection(rpcProvider);
});

test('wrong ConnectionInfo should throw error (original method)', async () => {
    const rpcProvider = new RpcProvider({ url: 'https://wrong-url.com/' });

    try {
        const result = await rpcProvider.sendJsonRpc('gas_price', [null]);

        expect(result).toBeUndefined();
    } catch (err) {
        expect(err.type).toBe('RetriesExceeded');
    }
});

test('wrong RPC details should work as long as there is at least one correct (new method)', async () => {
    const rpcProvider = new RpcProvider(
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
                id: 'near',
            },
        ])
    );

    await checkConnection(rpcProvider);
});

test('RPC details should throw error if all of them is invalid (new method)', async () => {
    const rpcProvider = new RpcProvider(
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
        ])
    );

    try {
        const result = await rpcProvider.sendJsonRpc('gas_price', [null]);

        expect(result).toBeUndefined();
    } catch (err) {
        expect(err.type).toBe('RetriesExceeded');
    }
});

test('wrong methods / params will throw error instead of keeping on retry (new method)', async () => {
    const rpcProvider = new RpcProvider(
        new RpcRotator([
            {
                id: 'near',
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
        const result = await rpcProvider.sendJsonRpc('gas_price', ['wrong params']);

        expect(result).toBeUndefined();
    } catch (err) {
        expect(err.type).not.toBe('RetriesExceeded');
    }
});
