import { ENearNetwork } from '@meteorwallet/meteor-near-sdk/dist/packages/common/core/modules/blockchains/near/core/types/near_basic_types';
import {
    AbstractCoreIndexer,
    E_CoreIndexerAvailableMethods,
} from './AbstractCoreIndexer';
import { NearblocksV1Indexer } from './NearblocksV1Indexer';
import { utils_pagination } from '../../../utils/pagination';

export class MeteorBackendIndexer extends AbstractCoreIndexer {
    networkSupported = [ENearNetwork.mainnet];
    priority = 6;
    methodsSupported = [E_CoreIndexerAvailableMethods.getAccountTransactions];

    protected getBaseUrl(): string {
        return this.network === ENearNetwork.mainnet
            ? 'https://backend-v2.meteorwallet.app/api/indexer'
            : new NearblocksV1Indexer(ENearNetwork.testnet).getBaseUrl();
    }

    getAccountIdListFromPublicKey(): Promise<string[]> {
        throw new Error('Method not implemented.');
    }

    getAccountFtList(): Promise<string[]> {
        throw new Error('Method not implemented.');
    }

    getAccountNftContractList(): Promise<string[]> {
        throw new Error('Method not implemented.');
    }

    async getAccountTransactions({
        accountId,
        page,
        pageSize,
    }: {
        accountId: string;
        page: number;
        pageSize: number;
    }): Promise<string[]> {
        const offset = utils_pagination.convertPageToOffset(page, pageSize);
        const response = await fetch(`${this.getBaseUrl()}/get_transaction_hashes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accountId, offset, pageSize }),
        });

        if (!response.ok) {
            throw new Error(
                'Error: MeteorBackendIndexer failed to return account transactions'
            );
        }
        const json = await response.json();
        return json.value;
    }

    async getValidatorList(): Promise<string[]> {
        return [];
    }

    async getAccountNfts(): Promise<string[]> {
        return [];
    }

    async getNftDetailByReference() {
        return {};
    }

    async getAccountValidatorList(): Promise<string[]> {
        return [];
    }
}
