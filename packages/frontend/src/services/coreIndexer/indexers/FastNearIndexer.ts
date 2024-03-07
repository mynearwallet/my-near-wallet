import { PublicKey } from 'near-api-js/lib/utils';
import {
    AbstractCoreIndexer,
    E_CoreIndexerAvailableMethods,
} from './AbstractCoreIndexer';
import { ENearNetwork } from '@meteorwallet/meteor-near-sdk/dist/packages/common/core/modules/blockchains/near/core/types/near_basic_types';

export class FastNearIndexer extends AbstractCoreIndexer {
    networkSupported = [ENearNetwork.mainnet];
    priority = 1;
    methodsSupported = [
        E_CoreIndexerAvailableMethods.getAccountIdListFromPublicKey,
        E_CoreIndexerAvailableMethods.getAccountFtList,
    ];

    protected getBaseUrl(): string {
        return 'https://api.fastnear.com/v0';
    }

    async getAccountFtList(accountId: string): Promise<string[]> {
        const result_1 = await fetch(`${this.getBaseUrl()}/account/${accountId}/ft`).then(
            (r) => r.json()
        );
        if (result_1.contract_ids && result_1.contract_ids.length > 0) {
            return result_1.contract_ids;
        } else {
            throw new Error(
                `Error: FastNear failed to capture account fungible token list for account id: ${accountId}`
            );
        }
    }

    async getAccountIdListFromPublicKey(
        publicKey: PublicKey | string
    ): Promise<string[]> {
        const result: Response_getAccountIdListFromPublicKey = await fetch(
            `${this.getBaseUrl()}/public_key/${publicKey}`
        ).then((r) => r.json());
        if (result.account_ids && result.account_ids.length > 0) {
            return result.account_ids;
        } else {
            throw new Error(
                `Error: FastNear failed to capture account ids from public key: ${publicKey}`
            );
        }
    }
}

interface Response_getAccountIdListFromPublicKey {
    public_key: string;
    account_ids: string[];
}
