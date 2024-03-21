import { stringifyUrl } from 'query-string';

import { NearBlocksTxnsResponse } from './type';
import CONFIG from '../../config';
import sendJson from '../../tmp_fetch_send_json';
import { CUSTOM_REQUEST_HEADERS } from '../../utils/constants';
import { accountsByPublicKey } from '@mintbase-js/data';

export default {
    listAccountsByPublicKey: (publicKey): Promise<string[]> => {
        return new Promise(async (masterResolve) => {
            const masterController = new AbortController();

            const promises = [
                // ---------------------
                // Nearblocks API3 kitwallet mock
                // ---------------------
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
                // ---------------------
                // Nearblocks API v1
                // ---------------------
                // fetch(`${CONFIG.INDEXER_NEARBLOCK_SERVICE_URL}/v1/keys/${publicKey}`, {
                //     headers: {
                //         accept: '*/*',
                //     },
                //     signal: masterController.signal,
                // })
                //     .then((res) => res.json())
                //     .then((res) => res.keys.map((key) => key.account_id))
                //     .catch((err) => {
                //         console.warn('nearblocks fetch error', err);
                //         return [];
                //     }),
                // ---------------------
                // Nearblocks API v1 mirror server
                // ---------------------
                // fetch(
                //     `${CONFIG.INDEXER_NEARBLOCK_EXPERIMENTAL_SERVICE_URL}/v1/keys/${publicKey}`,
                //     {
                //         headers: {
                //             accept: '*/*',
                //         },
                //         signal: masterController.signal,
                //     }
                // )
                //     .then((res) => res.json())
                //     .then((res) => res.keys.map((key) => key.account_id))
                //     .catch((err) => {
                //         console.warn('nearblocks experimental fetch error', err);
                //         return [];
                //     }),
                // ---------------------
                // Mintbase API
                // ---------------------
                accountsByPublicKey(
                    publicKey.toString(),
                    CONFIG.IS_MAINNET ? 'mainnet' : 'testnet'
                )
                    .then((res) => res.data ?? [])
                    .catch((err) => {
                        console.warn('mintbase fetch error', err);
                        return [];
                    }),
            ];

            if (CONFIG.IS_MAINNET) {
                // ---------------------
                // Fastnear API
                // ---------------------
                promises.push(
                    fetch(
                        `${CONFIG.INDEXER_FASTNEAR_SERVICE_URL}/v0/public_key/${publicKey}/all`,
                        {
                            signal: masterController.signal,
                        }
                    )
                        .then((res) => res.json())
                        .then((res) => res.account_ids ?? [])
                        .catch((err) => {
                            console.warn('fastnear fetch error', err);
                            return [];
                        })
                );
            }

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
                masterResolve([]);
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
    listLikelyTokens: (accountId) => {
        const url = `${CONFIG.INDEXER_SERVICE_URL}/account/${accountId}/likelyTokensFromBlock`;

        return sendJson(
            'GET',
            stringifyUrl({
                url,
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
