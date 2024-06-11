import { createAsyncThunk, createAction } from '@reduxjs/toolkit';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';

import { wallet } from '../../../utils/wallet';
import { selectAccountId } from '../account';
import { store } from '../../..';
import { keysToSnakeCase } from '../../../utils/object';

const SLICE_NAME = 'sign';

export const transactionsProgress = createAction<
    Partial<{
        txs: [];
        txIndex: number;
        txProgress: string;
    }>
>('transactionsProgress');

export const handleTransactionsExecutor = createAsyncThunk(
    `${SLICE_NAME}/handleTransactionsExecutor`,
    async (
        {
            txs,
            accountId,
        }: {
            txs: {
                receiverId: string;
                actions: [];
            }[];
            accountId?: string;
        },
        thunkAPI
    ) => {
        const res = [];
        const { dispatch, getState } = thunkAPI;
        const selectedAccountId = selectAccountId(getState());
        const currentAccountId = accountId || selectedAccountId;
        const walletAccount = await wallet.getAccount(currentAccountId);

        const result: {
            success: boolean;
            txHash: string;
            failReason: string;
            data: FinalExecutionOutcome[];
        } = {
            success: true,
            txHash: '',
            failReason: '',
            data: [],
        };

        dispatch(
            transactionsProgress({
                txs: txs.map((tx) => ({
                    ...tx,
                    transaction: {
                        receiver_id: tx.receiverId,
                        signer_id: currentAccountId,
                        actions: tx.actions.map((action) => {
                            return Object.entries(action).reduce((acc, [key, value]) => {
                                return {
                                    ...acc,
                                    [key.charAt(0).toUpperCase() + key.slice(1)]:
                                        keysToSnakeCase(value),
                                };
                            }, {});
                        }),
                    },
                })),
            })
        );
        for (let i = 0; i < txs.length; i++) {
            const tx = txs[i];
            dispatch(
                transactionsProgress({
                    txIndex: i,
                    txProgress: 'signing',
                })
            );
            const txRes = await walletAccount.signAndSendTransaction(tx);
            res.push(txRes);

            const {
                status,
                receipts_outcome,
                transaction: { hash },
            } = txRes;
            result.txHash = hash;

            const failedResult = receipts_outcome.find(
                ({ outcome: { status } }) => !!status?.Failure
            );

            if (failedResult?.outcome?.status?.Failure) {
                result.success = false;
                result.failReason = failedResult.outcome.status.Failure;
                dispatch(
                    transactionsProgress({
                        txIndex: i,
                        hash,
                        status,
                        txProgress: 'failed',
                    })
                );
            } else {
                dispatch(
                    transactionsProgress({
                        txIndex: i,
                        hash,
                        status,
                        txProgress: 'success',
                    })
                );
            }
        }
        result.data = res;
        dispatch(
            transactionsProgress({
                txs: [],
            })
        );
        return result;
    }
);

export async function dispatchTransactionExecutor(txOption, accountId?: string) {
    const res = await store.dispatch(
        await handleTransactionsExecutor({
            txs: [txOption],
            accountId,
        })
    );
    return (res.payload as { data: FinalExecutionOutcome[] }).data[0];
}

export async function dispatchTransactionsExecutor(txs, accountId?: string) {
    const res = await store.dispatch(
        await handleTransactionsExecutor({
            txs,
            accountId,
        })
    );
    return res.payload;
}
