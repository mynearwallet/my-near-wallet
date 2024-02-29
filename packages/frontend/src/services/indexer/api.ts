import { stringifyUrl } from 'query-string';

import { NearBlocksTxnsResponse } from './type';
import CONFIG from '../../config';
import sendJson from '../../tmp_fetch_send_json';
import { CUSTOM_REQUEST_HEADERS } from '../../utils/constants';

export default {
    listAccountsByPublicKey: (publicKey): Promise<string[]> => {
        return new Promise(async (masterResolve, masterReject) => {
            const masterController = new AbortController();

            const promises = [
                fetch(`${CONFIG.ACCOUNT_HELPER_URL}/keys/${publicKey}`)
                    .then((res) => res.json())
                    .then((res: unknown) =>
                        typeof res === 'object' &&
                        'keys' in res &&
                        Array.isArray(res.keys) &&
                        res.keys.length
                            ? res.keys.map((key: unknown) =>
                                  typeof key === 'object' &&
                                  'account_id' in key &&
                                  typeof key.account_id === 'string'
                                      ? key.account_id
                                      : ''
                              )
                            : []
                    ),
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
        const url = `${CONFIG.ACCOUNT_HELPER_URL}/${accountId}/txns`;
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
