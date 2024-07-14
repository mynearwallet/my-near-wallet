import { ObjectStorage } from './ObjectStorage';
import CONFIG from '../../../config';
import { RpcProvider, RpcProviderDetail, RpcRotator } from '../../mnw-api-js';

const mainnetConnections = [
    {
        id: 'near',
        label: 'Official Near Rpc',
        data: {
            url: 'https://rpc.mainnet.near.org',
        },
        priority: 10,
    },
    {
        id: 'fastNear',
        label: 'Fast Near Rpc',
        data: {
            url: 'https://free.rpc.fastnear.com',
        },
        priority: 11,
    },
    {
        id: 'lava',
        label: 'Lava Rpc',
        data: {
            url: 'https://near.lava.build',
        },
        priority: 12,
    },
    {
        id: 'betaNearRpc',
        label: 'Official Beta Rpc',
        data: {
            url: 'https://beta.rpc.mainnet.near.org',
        },
        priority: 13,
    },
];

const testnetConnections = [
    {
        id: 'near-testnet',
        label: 'Default Connection',
        data: {
            url: 'https://rpc.testnet.near.org',
        },
        priority: 10,
    },
];

export const defaultConnections = CONFIG.NEAR_WALLET_ENV.startsWith('mainnet')
    ? mainnetConnections
    : testnetConnections;

export class ConnectionsStorage extends ObjectStorage<RpcProviderDetail[]> {
    storageKey: string = 'connections';
    default: RpcProviderDetail[] = defaultConnections;

    public createProvider(): RpcProvider {
        return new RpcProvider(this.createRotator());
    }

    public createRotator(): RpcRotator {
        return new RpcRotator(this.load());
    }
}
