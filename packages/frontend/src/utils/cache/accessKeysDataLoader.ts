import DataLoader from 'dataloader';
import nearApiJs from 'near-api-js';
import { AccessKeyView } from 'near-api-js/lib/providers/provider';
import Cache from 'node-cache';

import { wrapNodeCacheForDataloader } from './helper/wrapNodeCacheForDataloader';
import CONFIG from '../../config';
import { getKeyMeta, wallet } from '../wallet';

let accessKeysDataLoader: DataLoader<string, AccessKeyLikeArray>;

interface AccessKeyLike {
    public_key: string;
    access_key: AccessKeyView;
    created?: {
        transaction_hash: string;
        block_timestamp: number;
    };
    meta?: any;
}

type AccessKeyLikeArray = AccessKeyLike[];

async function getAccessKeys(accountId: string): Promise<AccessKeyLikeArray> {
    if (!accountId) {
        return Promise.resolve([]);
    }

    const walletAccount: nearApiJs.Account = await wallet.getAccount(accountId);

    const accessKeys: AccessKeyLike[] = await walletAccount.getAccessKeys();

    {
        let pageCount = 1;
        let response: {
            keys?: any[];
        } = {};

        do {
            response = await fetch(
                `${
                    CONFIG.INDEXER_NEARBLOCK_SERVICE_URL
                }/v1/account/${accountId}/keys?page=${pageCount++}&per_page=25`
            ).then((res) => res.json());

            response.keys.forEach((keyInfo) => {
                accessKeys
                    .filter((accessKey) => accessKey.public_key !== keyInfo.public_key)
                    .forEach((accessKey) => {
                        accessKey.created = keyInfo.created;
                    });
            });
        } while (response?.keys?.length === 25);
    }

    return Promise.all(
        accessKeys.map(async (accessKey) => ({
            ...accessKey,
            meta: await getKeyMeta(accessKey.public_key),
        }))
    );
}

export function getAccessKeysDataLoader() {
    if (accessKeysDataLoader) {
        return accessKeysDataLoader;
    }

    accessKeysDataLoader = new DataLoader<string, AccessKeyLikeArray>(
        async (accountIds: readonly string[]): Promise<AccessKeyLikeArray[]> => {
            try {
                return Promise.all(
                    accountIds.map((accountId) => getAccessKeys(accountId))
                );
            } catch (error) {
                console.error(`Failed to fetch access keys: ${error}`);
                return [];
            }
        },
        {
            cacheMap: wrapNodeCacheForDataloader(
                new Cache({ stdTTL: 60, checkperiod: 0, useClones: false })
            ),
        }
    );

    return accessKeysDataLoader;
}
