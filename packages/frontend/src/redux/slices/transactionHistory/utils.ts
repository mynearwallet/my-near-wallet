import { ENearNetwork } from '@meteorwallet/meteor-near-sdk/dist/packages/common/core/modules/blockchains/near/core/types/near_basic_types';
import dayjs from 'dayjs';

import { IPFS_NFT_CACHE_URL } from './constant';
import { TxDefaultPattern, txPatterns } from './transactionPattern';
import { ETxDirection, TransactionItemComponent } from './type';

export function transactionToHistoryUIData(
    data,
    accountId,
    network
): TransactionItemComponent {
    const matchedPattern = txPatterns.find((pattern) => pattern.match(data, network));
    if (matchedPattern) {
        return matchedPattern.display(data, accountId, network);
    }

    const defaultPattern = new TxDefaultPattern();
    return defaultPattern.display(data);
}

export const transPico2Date = (pico: number | string): Date => {
    if (typeof pico === 'string') {
        pico = parseFloat(pico);
    }
    const ms = pico / Math.pow(10, 6);
    return new Date(ms);
};

export function groupedByDate(trxs: TransactionItemComponent[]) {
    return trxs.reduce((acc, transaction) => {
        const d = dayjs(transPico2Date(transaction.dateTime || ''));
        let date = d.format('YYYY-MM-DD');
        const diff = dayjs().startOf('day').diff(d.startOf('day'), 'days');
        if (diff === 0) {
            date = 'today';
        } else if (diff === 1) {
            date = 'yesterday';
        }

        const existingIndex = acc.findIndex((group) => group.date === date);

        if (existingIndex !== -1) {
            acc[existingIndex].transactions.push(transaction);
        } else {
            acc.push({ date, transactions: [transaction] });
        }

        return acc;
    }, [] as { date: string; transactions: TransactionItemComponent[] }[]);
}

export function getPrefixByDir(dir?: ETxDirection): string {
    if (dir === ETxDirection.receive) {
        return '+';
    } else if (dir === ETxDirection.send) {
        return '-';
    }
    return '';
}

export const IpfsCacheApi = {
    getNftTokenImgUrl,
};

function getNftTokenImgUrl(network: ENearNetwork, contractId: string, tokenId: string) {
    return `${IPFS_NFT_CACHE_URL}/network/${network}/nfts/${contractId}/tokens/${tokenId}/image`;
}

export function getMeteorPointsContractId(network: ENearNetwork) {
    return network === ENearNetwork.mainnet
        ? 'meteor-points.near'
        : 'mst.testcandy.testnet';
}
