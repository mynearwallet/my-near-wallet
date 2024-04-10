import { ENearNetwork } from '@meteorwallet/meteor-near-sdk/dist/packages/common/core/modules/blockchains/near/core/types/near_basic_types';
import {
    AbstractCoreIndexer,
    E_CoreIndexerAvailableMethods,
} from './AbstractCoreIndexer';
import { NearBlocksBlockData } from '../types/nearblocksV1Indexer.type';
import { CUSTOM_REQUEST_HEADERS } from '../../../utils/constants';

export class NearblocksV1Indexer extends AbstractCoreIndexer {
    networkSupported = [ENearNetwork.mainnet, ENearNetwork.testnet];
    priority = 4;
    methodsSupported = [
        E_CoreIndexerAvailableMethods.getAccountIdListFromPublicKey,
        E_CoreIndexerAvailableMethods.getAccountFtList,
    ];

    protected getBaseUrl(): string {
        return this.network === ENearNetwork.mainnet
            ? 'https://api.nearblocks.io/v1'
            : 'https://api-testnet.nearblocks.io/v1';
    }

    async getAccountFtList(accountId: string): Promise<string[]> {
        const result_1 = await fetch(
            `${this.getBaseUrl()}/kitwallet/account/${accountId}/likelyTokens`
        ).then((r) => r.json());
        if (result_1 instanceof Array && result_1.length > 0) {
            return result_1;
        } else {
            throw new Error(
                `Error: Nearblocks V1 failed to capture account fungible token list for account id: ${accountId}`
            );
        }
    }

    async getAccountIdListFromPublicKey(publicKey: string): Promise<string[]> {
        const response = await fetch(`${this.getBaseUrl()}/keys/${publicKey}`);

        if (!response.ok) {
            const message = `An error has occured: ${response.status}`;
            console.error(response);
            throw new Error(`Error: NearBlocks V1 call error ${message}`);
        }

        const result = (await response.json()) as I_getAccountIdListFromPublicKey_Output;
        if (result.keys && result.keys instanceof Array && result.keys.length > 0) {
            return result.keys.map((item) => item.account_id);
        } else {
            throw new Error(
                `Error: Nearblocks V1 failed to capture account ids from public key: ${publicKey}`
            );
        }
    }

    async getAccountValidatorList(accountId: string): Promise<string[]> {
        const stakingDeposits = await fetch(
            `${this.getBaseUrl()}/kitwallet/staking-deposits/${accountId}`,
            {
                headers: {
                    ...CUSTOM_REQUEST_HEADERS,
                },
            }
        ).then((r) => r.json());
        return stakingDeposits.map((d) => d.validator_id);
    }

    async getValidatorList(): Promise<string[]> {
        return fetch(`${this.getBaseUrl()}/kitwallet/stakingPools`, {
            headers: {
                ...CUSTOM_REQUEST_HEADERS,
            },
        }).then((r) => r.json());
    }

    async getAccountNfts(): Promise<string[]> {
        return [];
    }
}

interface I_getAccountIdListFromPublicKey_Output {
    keys: {
        public_key: string;
        account_id: string;
        permission_kind: string;
        created: NearBlocksBlockData;
        deleted: NearBlocksBlockData;
    }[];
}
