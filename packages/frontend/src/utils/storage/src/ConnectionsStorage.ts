import { BaseStorage } from './BaseStorage';
import CONFIG from '../../../config';
import { RpcProvider, RpcProviderDetail, RpcRotator } from '../../mnw-api-js';

const defaultConnections = [
    {
        id: CONFIG.NEAR_WALLET_ENV.startsWith('mainnet') ? 'near' : 'near-testnet',
        label: 'Default Connection',
        priority: 10,
    },
];

export class ConnectionsStorage extends BaseStorage<RpcProviderDetail[]> {
    storageKey: string = 'connections';
    default: RpcProviderDetail[] = defaultConnections;

    public createProvider(): RpcProvider {
        return new RpcProvider(this.createRotator());
    }

    public createRotator(): RpcRotator {
        return new RpcRotator(this.load());
    }
}
