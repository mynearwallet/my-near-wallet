import { stringifyUrl } from 'query-string';

import { NearBlocksTxnsResponse } from './type';
import CONFIG from '../../config';
import sendJson from '../../tmp_fetch_send_json';
import { CUSTOM_REQUEST_HEADERS } from '../../utils/constants';
import { fetchWithTimeout, timeout } from '../../utils/request';
import { accountsByPublicKey } from '@mintbase-js/data';

export default {
    listAccountsByPublicKey: (publicKey) => {
        return Promise.all([
            fetchWithTimeout(
                `${CONFIG.INDEXER_SERVICE_URL}/publicKey/${publicKey}/accounts`,
                {
                    headers: {
                        ...CUSTOM_REQUEST_HEADERS,
                    },
                },
                30000
            )
                .then((res) => res.json())
                .catch((err) => {
                    console.warn('Error fetching accounts from kitwallet indexer', err);
                    return [];
                }),
            fetchWithTimeout(
                `${CONFIG.INDEXER_NEARBLOCK_EXPERIMENTAL_SERVICE_URL}/v1/keys/${publicKey}`,
                {
                    headers: {
                        accept: '*/*',
                    },
                },
                30000
            )
                .then((res) => res.json())
                .then((res) => res.keys.map((key) => key.account_id))
                .catch((err) => {
                    console.warn('Error fetching accounts from nearblock', err);
                    return [];
                }),
            timeout(
                30000,
                accountsByPublicKey(publicKey, CONFIG.IS_MAINNET ? 'mainnet' : 'testnet')
            )
                .then((res) => res.data ?? [])
                .catch((err) => {
                    console.warn('Error fetching accounts from mintbase', err);
                    return [];
                }),
        ]).then(([accounts, accountsFromNearblock, accountsFromMintbase]) => {
            return [
                ...new Set([
                    ...accounts,
                    ...accountsFromNearblock,
                    ...accountsFromMintbase,
                ]),
            ];
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
