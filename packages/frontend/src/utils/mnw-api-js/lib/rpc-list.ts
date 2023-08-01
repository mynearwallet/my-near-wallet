import { TypedError } from 'near-api-js/lib/providers';

import { RpcOption } from ',/type';

export const mainnetRpcOptionList: RpcOption[] = [
    {
        id: 'near',
        defaultParams: {
            url: 'https://rpc.mainnet.near.org',
        },
    },
    {
        id: 'pagoda',
        defaultParams: {
            url: 'https://near-mainnet.api.pagoda.co/rpc/v1',
        },
        userParams: ['apiKey'],
        generator: ({ url, headers, apiKey }) => ({
            url,
            headers: {
                ...headers,
                'x-api-key': apiKey,
            },
        }),
    },
    {
        id: 'onerpc',
        defaultParams: {
            url: 'https://1rpc.io/near',
        },
    },
    {
        id: 'ankr',
        defaultParams: {
            url: 'https://rpc.ankr.com/near',
        },
    },
    {
        id: 'getBlock',
        defaultParams: {
            url: 'https://near.getblock.io/<api_key>/mainnet',
        },
        userParams: ['apiKey'],
        generator: ({ url, headers, apiKey }) => ({
            url: url.replace('<api_key>', apiKey),
            headers: {
                ...headers,
                'x-api-key': apiKey,
            },
        }),
    },
    {
        id: 'infura',
        defaultParams: {
            url: 'https://near-mainnet.infura.io/v3/API-KEY',
        },
        userParams: ['apiKey'],
        generator: ({ url, headers, apiKey }) => ({
            url: url.replace('API-KEY', apiKey),
            headers,
        }),
    },
    {
        id: 'nodeReal',
        defaultParams: {
            url: 'https://open-platform.nodereal.io/API-KEY/near',
        },
        userParams: ['apiKey'],
        generator: ({ url, headers, apiKey }) => ({
            url: url.replace('API-KEY', apiKey),
            headers,
        }),
    },
    {
        id: 'custom',
        userParams: ['url', 'headers'],
        generator: ({ url, headers }) => ({
            url,
            headers,
        }),
    },
];

export const testnetRpcOptionList: RpcOption[] = [
    {
        id: 'near',
        defaultParams: {
            url: 'https://rpc.testnet.near.org',
        },
    },
    {
        id: 'pagoda',
        defaultParams: {
            url: 'https://near-testnet.api.pagoda.co/rpc/v1',
        },
        userParams: ['apiKey'],
        generator: ({ url, headers, apiKey }) => ({
            url,
            headers: {
                ...headers,
                'x-api-key': apiKey,
            },
        }),
    },
    {
        id: 'infura',
        defaultParams: {
            url: 'https://near-testnet.infura.io/v3/API-KEY',
        },
        userParams: ['apiKey'],
        generator: ({ url, headers, apiKey }) => ({
            url: url.replace('API-KEY', apiKey),
            headers,
        }),
    },
    {
        id: 'custom',
        userParams: ['url', 'headers'],
        generator: ({ url, headers }) => ({
            url,
            headers,
        }),
    },
];

export class RpcRotator {
    static readonly list: RpcInfo[] = [...rpcList];
    protected _list: RpcInfo[];

    constructor(rpcList: RpcInfo[] = RpcRotator.list) {
        this._list = [...rpcList];
    }

    next(urlToRemove?: string): RpcInfo {
        if (urlToRemove) {
            this.removeUrlFromList(urlToRemove);
        }

        return this.getRandomRpc();
    }

    setRpcList(rpcList: RpcInfo[]): void {
        this._list = [...rpcList];
    }

    getRpcList(): RpcInfo[] {
        return [...this._list];
    }

    protected getRandomRpc(): RpcInfo {
        if (this._list.length === 0) {
            throw new TypedError(
                'All RPC providers have been tried.',
                'AllProvidersTried'
            );
        }

        return this._list[Math.floor(Math.random() * this._list.length)];
    }

    protected removeUrlFromList(urlToRemove: string): void {
        this._list = this._list.filter((rpcInfo: RpcInfo) => rpcInfo.url !== urlToRemove);
    }
}
