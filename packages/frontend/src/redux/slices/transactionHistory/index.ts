import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import set from 'lodash.set';
import uniq from 'lodash.uniq';
import { providers } from 'near-api-js';

import { nearMetadata, wNearMetadata } from './transactionPattern';
import { IMetaData, ITransactionListItem } from './type';
import CONFIG from '../../../config';
import { listTransactions } from '../../../services/indexer';
import { getCachedContractMetadataOrFetch } from '../tokensMetadata';

/****************************/
// Var declarations
/****************************/
const SLICE_NAME = 'transactionHistory';
const PER_PAGE = 15;

interface ITransactionHistoryState {
    transactions: [];
}

const initialState: ITransactionHistoryState = {
    transactions: [],
};

/****************************/
// Slice
/****************************/
const transactionHistorySlice = createSlice({
    name: SLICE_NAME,
    initialState,
    reducers: {
        setTransactions(state, actions) {
            set(state, ['transactions'], actions.payload);
        },
    },
});

async function fetchAllMetaData(state, allReceiver: string[]) {
    const res: any = await Promise.allSettled([
        ...allReceiver.map((contractName) => {
            return getCachedContractMetadataOrFetch(contractName, state);
        }),
    ]);
    const metas: { [key: string]: IMetaData } = {};
    allReceiver.forEach((receiverId, i) => {
        metas[receiverId] = res[i]?.value || res[i + allReceiver.length]?.value;
    });
    return metas;
}

const fetchTransactions = createAsyncThunk(
    `${SLICE_NAME}/fetchTransactions`,
    async (state: { accountId: string; page: number }, { dispatch }) => {
        const { accountId, page } = state;
        const indexerTransactions = await listTransactions(accountId, page, PER_PAGE);
        const transactionsHashs: string[] = uniq(
            indexerTransactions.txns.map((item) => item.transaction_hash)
        );
        const transactionsRaw = await Promise.allSettled(
            transactionsHashs.map((txHash) => {
                return getTransactionDetail({ txHash, accountId });
            })
        );
        const transactions = transactionsRaw
            .map((item) => (item.status === 'fulfilled' ? item.value : null))
            .filter(Boolean);
        const { setTransactions } = transactionHistorySlice.actions;

        const receipt_ids: string[] = [];
        for (const t of transactions) {
            for (const r of t?.receipts || []) {
                receipt_ids.push(r.receiver_id);
            }
        }
        const metaDatas = await fetchAllMetaData(
            state,
            uniq([
                ...receipt_ids,
                // ...transactions.map((item) => item.transaction?.receiver_id),
            ])
        );

        const result = transactions
            .map((item) => {
                const action = item.transaction.actions[0];
                const isNear = action.Transfer;
                const indexerTransaction = indexerTransactions.txns.find(
                    (t) => t.transaction_hash === item.transaction.hash
                );
                const delegateReceiverId =
                    action.Delegate?.delegate_action.receiver_id || '';
                return {
                    ...item,
                    block_timestamp: indexerTransaction?.block_timestamp,
                    transaction_hash: item.transaction.hash,
                    receipts: item.receipts.map((r) => {
                        const isNear = r.receipt.Action.actions[0]?.Transfer;
                        const isWNear = r.receiver_id === 'wrap.near';
                        const defaultMetaData = isWNear
                            ? wNearMetadata
                            : metaDatas[r.receiver_id];
                        return {
                            ...r,
                            metaData: isNear
                                ? nearMetadata
                                : defaultMetaData || metaDatas[r.predecessor_id],
                        };
                    }),
                    metaData: isNear
                        ? nearMetadata
                        : metaDatas[item.transaction?.receiver_id] ||
                          metaDatas[delegateReceiverId] ||
                          {},
                };
            })
            .filter(Boolean);
        dispatch(setTransactions(result));
    }
);

export const transactionHistoryActions = {
    fetchTransactions,
};

export const getTransactionDetail = ({
    txHash,
    accountId,
}): Promise<ITransactionListItem> => {
    const provider = new providers.JsonRpcProvider({
        url: CONFIG.NODE_ARCHIVAL_URL,
    });
    return provider.sendJsonRpc('EXPERIMENTAL_tx_status', [txHash, accountId]);
};
export default transactionHistorySlice;

export const transactionHistorySelector = (state) => state[SLICE_NAME].transactions;
