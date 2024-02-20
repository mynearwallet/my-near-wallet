import { ObjectStorage } from './ObjectStorage';
import CONFIG from '../../../config';
import { RpcProvider, RpcProviderDetail, RpcRotator } from '../../mnw-api-js';

const defaultConnections = [
    {
        id: CONFIG.NEAR_WALLET_ENV.startsWith('mainnet')
            ? 'near'
            : CONFIG.NEAR_WALLET_ENV.startsWith('statelessnet')
            ? 'near-statelessnet'
            : 'near-testnet',
        label: 'Default Connection',
        priority: 10,
    },
];

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
