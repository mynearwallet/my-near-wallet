import { TypedError } from 'near-api-js/lib/providers';

import { ConnectionInfo, RpcOption, RpcOptionValue, RpcProviderDetail } from './type';

const mainnetRpcOptionList: RpcOption[] = [
    {
        id: 'near',
        defaultParams: {
            url: 'https://rpc.mainnet.near.org/',
        },
    },
    {
        id: 'ankr',
        defaultParams: {
            url: 'https://rpc.ankr.com/near/',
        },
    },
    {
        id: 'getBlock',
        defaultParams: {
            url: 'https://near.getblock.io/<api_key>/mainnet/',
        },
        userParams: ['apiKey'],
        generator: ({ url, headers, apiKey }) => ({
            url: url.replace('<api_key>', apiKey),
            headers: headers,
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
            url: 'https://open-platform.nodereal.io/API-KEY/near/',
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

const testnetRpcOptionList: RpcOption[] = [
    {
        id: 'near-testnet',
        defaultParams: {
            url: 'https://rpc.testnet.near.org/',
        },
    },
    {
        id: 'infura-testnet',
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
        id: 'custom-testnet',
        userParams: ['url', 'headers'],
        generator: ({ url, headers }) => ({
            url,
            headers,
        }),
    },
];

const statelessnetRpcOptionList: RpcOption[] = [
    {
        id: 'near-statelessnet',
        defaultParams: {
            url: 'https://rpc.statelessnet.near.org',
        },
    },
    {
        id: 'custom-statelessnet',
        userParams: ['url', 'headers'],
        generator: ({ url, headers }) => ({
            url,
            headers,
        }),
    },
];

const indexedRpcOptions: Record<string, RpcOption> = [
    ...testnetRpcOptionList,
    ...mainnetRpcOptionList,
    ...statelessnetRpcOptionList,
].reduce(
    (
        indexedRpcOptions: Record<string, RpcOption>,
        rpcOption: RpcOption
    ): Record<string, RpcOption> => {
        indexedRpcOptions[rpcOption.id] = rpcOption;
        return indexedRpcOptions;
    },
    {}
);

export class RpcRotator {
    static getRpcOptionList(
        environment: 'mainnet' | 'testnet' | 'statelessnet'
    ): RpcOption[] {
        if (environment === 'mainnet') {
            return mainnetRpcOptionList;
        } else if (environment === 'testnet') {
            return testnetRpcOptionList;
        } else if (environment === 'statelessnet') {
            return statelessnetRpcOptionList;
        }

        return testnetRpcOptionList;
    }

    protected connections: ConnectionInfo[];

    constructor(rpcProviderDetails: RpcProviderDetail[]) {
        if (rpcProviderDetails.length === 0) {
            throw new TypedError(
                'Need at least one rpc provider.',
                'EmptyRpcProviderDetails'
            );
        }

        this.connections = rpcProviderDetails.reduce(
            (
                connections: ConnectionInfo[],
                rpcProviderDetail: RpcProviderDetail
            ): ConnectionInfo[] => {
                const rpcOption: RpcOption = indexedRpcOptions[rpcProviderDetail.id];

                if (rpcOption === undefined) {
                    throw new TypedError(
                        `Rpc Provider ${rpcProviderDetail.label} is invalid.`,
                        'InvalidRpcProviderDetail'
                    );
                }

                const data: RpcOptionValue = {
                    url: rpcProviderDetail.data?.url ?? rpcOption.defaultParams?.url,
                    apiKey:
                        rpcProviderDetail.data?.apiKey ?? rpcOption.defaultParams?.apiKey,
                    headers: {
                        'Content-Type': 'application/json',
                        ...rpcOption.defaultParams?.headers,
                        ...rpcProviderDetail.data?.headers,
                    },
                };

                const connection: ConnectionInfo =
                    rpcOption.generator === undefined
                        ? {
                              url: data.url,
                              headers: data.headers,
                          }
                        : rpcOption.generator(data);

                connections.push(connection);

                return connections;
            },
            []
        );
    }

    getConnection(id = 0): ConnectionInfo {
        const index = id % this.connections.length;

        return this.connections[index];
    }
}
