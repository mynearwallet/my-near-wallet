import { stringifyUrl } from 'query-string';

import { NearBlocksTxnsResponse } from './type';
import CONFIG from '../../config';
import sendJson from '../../tmp_fetch_send_json';
import { CUSTOM_REQUEST_HEADERS } from '../../utils/constants';
import { accountsByPublicKey } from '@mintbase-js/data';

export default {
    listAccountsByPublicKey: (publicKey): Promise<string[]> => {
        return new Promise(async (masterResolve, masterReject) => {
            const masterController = new AbortController();

            const promises = [
                fetch(`${CONFIG.INDEXER_SERVICE_URL}/publicKey/${publicKey}/accounts`, {
                    headers: {
                        ...CUSTOM_REQUEST_HEADERS,
                    },
                    signal: masterController.signal,
                })
                    .then((res) => res.json())
                    .catch((err) => {
                        console.warn('kitwallet fetch error', err);
                        return [];
                    }),
                fetch(`${CONFIG.INDEXER_NEARBLOCK_SERVICE_URL}/v1/keys/${publicKey}`, {
                    headers: {
                        accept: '*/*',
                    },
                    signal: masterController.signal,
                })
                    .then((res) => res.json())
                    .then((res) => res.keys.map((key) => key.account_id))
                    .catch((err) => {
                        console.warn('nearblocks fetch error', err);
                        return [];
                    }),
                fetch(
                    `${CONFIG.INDEXER_NEARBLOCK_EXPERIMENTAL_SERVICE_URL}/v1/keys/${publicKey}`,
                    {
                        headers: {
                            accept: '*/*',
                        },
                        signal: masterController.signal,
                    }
                )
                    .then((res) => res.json())
                    .then((res) => res.keys.map((key) => key.account_id))
                    .catch((err) => {
                        console.warn('nearblocks experimental fetch error', err);
                        return [];
                    }),
                accountsByPublicKey(publicKey, CONFIG.IS_MAINNET ? 'mainnet' : 'testnet')
                    .then((res) => res.data ?? [])
                    .catch((err) => {
                        console.warn('mintbase fetch error', err);
                        return [];
                    }),
            ];

            const results = await Promise.all(
                promises.map((promise) =>
                    promise.then((data) => {
                        if (data.length === 0) {
                            return data;
                        }

                        masterController.abort();
                        masterResolve(data);
                    })
                )
            );

            const flattenResults = results.flat();

            if (flattenResults.length === 0) {
                masterReject(new Error('No accounts found'));
            }
        });
    },
    listLikelyNfts: (accountId, timestamp) => {
        const url = `${CONFIG.INDEXER_SERVICE_URL}/account/${accountId}/likelyNFTsFromBlock`;
        return sendJson(
            'GET',
            stringifyUrl({
                url,
                query: {
                    fromBlockTimestamp: timestamp,
                },
            })
        );
    },
    listLikelyTokens: (accountId, timestamp) => {
        const url = `${CONFIG.INDEXER_SERVICE_URL}/account/${accountId}/likelyTokensFromBlock`;

        return sendJson(
            'GET',
            stringifyUrl({
                url,
                query: {
                    fromBlockTimestamp: timestamp,
                },
            })
        );
    },
    listRecentTransactions: (accountId) => {
        return fetch(`${CONFIG.INDEXER_SERVICE_URL}/account/${accountId}/activity`, {
            headers: {
                ...CUSTOM_REQUEST_HEADERS,
            },
        }).then((res) => res.json());
    },
    listTransactions: (
        accountId: string,
        page: number,
        perPage: number
    ): Promise<NearBlocksTxnsResponse> => {
        const url = `${CONFIG.INDEXER_NEARBLOCK_SERVICE_URL}/v1/account/${accountId}/txns`;
        return sendJson(
            'GET',
            stringifyUrl({
                url,
                query: {
                    order: 'desc',
                    page,
                    per_page: perPage,
                },
            })
        );
    },
    listStakingDeposits: (accountId) => {
        return fetch(`${CONFIG.INDEXER_SERVICE_URL}/staking-deposits/${accountId}`, {
            headers: {
                ...CUSTOM_REQUEST_HEADERS,
            },
        }).then((r) => r.json());
    },
    listStakingPools: () => {
        return fetch(`${CONFIG.INDEXER_SERVICE_URL}/stakingPools`, {
            headers: {
                ...CUSTOM_REQUEST_HEADERS,
            },
        }).then((r) => r.json());
    },
};
