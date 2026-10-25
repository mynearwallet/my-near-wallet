import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { parseRpcError } from 'near-api-js/lib/utils/rpc_errors';

import { handleTransactionsExecutor } from './transactionExecutor';
import { wallet } from '../../../utils/wallet';

jest.mock('../../../utils/wallet', () => ({ wallet: { getAccount: jest.fn() } }));
jest.mock('../../..', () => ({ store: { dispatch: jest.fn() } }));
jest.mock('../account', () => ({ selectAccountId: (state) => state.accountId }));
jest.mock('../ledger', () => ({
    actions: {},
    selectLedgerConnectionAvailable: () => true,
    selectLedgerHasLedger: () => false,
}));

const txs = [
    { receiverId: 'wrap.near', actions: [] },
    { receiverId: 'token.near', actions: [] },
];
const outcome = (hash: string, failed = false) => ({
    status: { SuccessValue: '' },
    transaction: { hash },
    receipts_outcome: [
        {
            outcome: {
                status: failed ? { Failure: { error: 'failed' } } : { SuccessValue: '' },
            },
        },
    ],
});

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

test('retains all available receipts when a transaction fails', async () => {
    const failed = outcome('failed-hash', true);
    const signAndSendTransaction = jest
        .fn<() => Promise<any>>()
        .mockResolvedValue(failed);
    (wallet.getAccount as jest.Mock<() => Promise<any>>).mockResolvedValue({
        signAndSendTransaction,
    });
    const action = await handleTransactionsExecutor({ txs, accountId: 'alice.near', captureUnknown: true })(
        jest.fn(),
        () => ({ accountId: 'alice.near' }),
        undefined
    );
    expect(action.payload).toMatchObject({
        success: false,
        txHash: 'failed-hash',
        data: [failed],
    });
    expect(signAndSendTransaction).toHaveBeenCalledTimes(1);
    expect(signAndSendTransaction).toHaveBeenCalledWith({ ...txs[0], returnError: true });
});

test('stops remaining transactions when the active account changes', async () => {
    let accountId = 'alice.near';
    const first = outcome('first-hash');
    const signAndSendTransaction = jest
        .fn<() => Promise<any>>()
        .mockImplementation(async () => {
            accountId = 'bob.near';
            return first;
        });
    (wallet.getAccount as jest.Mock<() => Promise<any>>).mockResolvedValue({
        signAndSendTransaction,
    });
    const action = await handleTransactionsExecutor({
        txs,
        accountId,
        shouldContinue: () => true,
        captureUnknown: true,
    })(jest.fn(), () => ({ accountId }), undefined);
    expect(action.payload).toMatchObject({
        success: false,
        txHash: 'first-hash',
        data: [first],
    });
    expect(signAndSendTransaction).toHaveBeenCalledTimes(1);
});

test('preserves the signed hash when the broadcast response is unknown', async () => {
    const signAndSendTransaction = jest
        .fn<() => Promise<any>>()
        .mockRejectedValue({ context: { transactionHash: 'swap-hash' } });
    (wallet.getAccount as jest.Mock<() => Promise<any>>).mockResolvedValue({
        signAndSendTransaction,
    });
    const action = await handleTransactionsExecutor({ txs, accountId: 'alice.near', captureUnknown: true })(
        jest.fn(),
        () => ({ accountId: 'alice.near' }),
        undefined
    );
    expect(action.payload).toMatchObject({
        success: false,
        unconfirmed: true,
        txHash: 'swap-hash',
    });
    expect(signAndSendTransaction).toHaveBeenCalledTimes(1);
});

test('reports a rejected insufficient-balance transaction as failed, without an unconfirmed hash', async () => {
    const error = parseRpcError({
        TxExecutionError: {
            InvalidTxError: {
                NotEnoughBalance: {
                    balance: '597365742304894786594716',
                    cost: '600927655853402500000001',
                    signer_id: 'alice.near',
                },
            },
        },
    });
    Object.assign(error, { context: { transactionHash: 'rejected-hash' } });
    const first = outcome('preparation-hash');
    const signAndSendTransaction = jest
        .fn<() => Promise<any>>()
        .mockResolvedValueOnce(first)
        .mockRejectedValueOnce(error);
    jest.mocked(wallet.getAccount).mockResolvedValue({ signAndSendTransaction } as any);
    const action = await handleTransactionsExecutor({ txs, accountId: 'alice.near', captureUnknown: true })(
        jest.fn(),
        () => ({ accountId: 'alice.near' }),
        undefined
    );
    expect(action.payload).toMatchObject({
        success: false,
        unconfirmed: false,
        txHash: '',
        failReason: error.message,
        data: [first],
    });
    expect(error.message).toContain('does not have enough balance');
    expect(signAndSendTransaction).toHaveBeenCalledTimes(2);
});

test('ordinary callers submit their original transaction without V2 options', async () => {
    const signAndSendTransaction = jest.fn<() => Promise<any>>().mockResolvedValue(outcome('hash'));
    jest.mocked(wallet.getAccount).mockResolvedValue({ signAndSendTransaction } as any);
    await handleTransactionsExecutor({ txs: [txs[0]], accountId: 'alice.near' })(
        jest.fn(),
        () => ({ accountId: 'alice.near' }),
        undefined
    );
    expect(signAndSendTransaction).toHaveBeenCalledWith(txs[0]);
});
