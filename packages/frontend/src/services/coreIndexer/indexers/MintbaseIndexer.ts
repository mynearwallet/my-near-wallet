import { ENearNetwork } from '@meteorwallet/meteor-near-sdk/dist/packages/common/core/modules/blockchains/near/core/types/near_basic_types';
import {
    AbstractCoreIndexer,
    E_CoreIndexerAvailableMethods,
} from './AbstractCoreIndexer';
import { accountsByPublicKey } from '@mintbase-js/data';
import { Network } from '@mintbase-js/sdk';

export class MintbaseIndexer extends AbstractCoreIndexer {
    networkSupported = [ENearNetwork.mainnet, ENearNetwork.testnet];
    priority = 3;
    methodsSupported = [E_CoreIndexerAvailableMethods.getAccountIdListFromPublicKey];

    protected getBaseUrl(): string {
        return '';
    }

    getAccountFtList(): Promise<string[]> {
        return Promise.resolve([]);
    }

    async getAccountIdListFromPublicKey(publicKey: string): Promise<string[]> {
        const { data, error } = await accountsByPublicKey(
            publicKey,
            this.network as Network
        );
        if (error || !data || data.length === 0) {
            console.error(error);
            throw new Error(
                `Error: FastNear failed to capture account fungible token list for account id: ${publicKey}`
            );
        }
        return data;
    }

    getAccountValidatorList(): Promise<string[]> {
        return Promise.resolve([]);
    }
}
