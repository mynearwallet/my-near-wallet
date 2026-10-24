import { beforeEach, expect, jest, test } from '@jest/globals';

import SmartRouterV2 from './SmartRouterV2';
import type { SwapQuote } from './quotes';

jest.mock('../../config', () => ({
    __esModule: true,
    default: { NEAR_ID: 'NEAR', NEAR_TOKEN_ID: 'wrap.near' },
}));
jest.mock('../../utils/fiatValueManager', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        fetchRefFinancePrices: jest.fn(async () => ({
            near: { usd: 5 },
            'wrap.near': { usd: 5 },
            'usdt.tether-token.near': { usd: 1 },
        })),
    })),
}));
jest.mock('../../utils/wallet', () => ({ wallet: {} }));
jest.mock('./quotes', () => ({
    ...jest.requireActual<typeof import('./quotes')>('./quotes'),
    getTransactionFee: jest.fn(async () => ({
        estimatedFee: '0.01',
        requiredNearBalance: '0.1',
    })),
}));

const amountIn = '1000000000000000000000';
const input = { contractName: 'NEAR', onChainFTMetadata: { decimals: 24 } };
const output = {
    contractName: 'usdt.tether-token.near',
    onChainFTMetadata: { decimals: 6 },
};

function routerData(tokens = ['wrap.near', 'usdt.tether-token.near']) {
    return {
        result_code: 0,
        result_data: {
            amount_in: amountIn,
            amount_out: '5000',
            min_amount_out: '4975',
            msg: 'opaque-message',
            signature: 'opaque-signature',
            tokens,
        },
    };
}

function account(view?: (contract: string, method: string, args: any) => unknown) {
    return {
        accountId: 'example.near',
        viewFunction: jest.fn(async (contract: string, method: string, args: any) => {
            if (view) {
                return view(contract, method, args);
            }
            if (method === 'storage_balance_of') {
                return { total: '1250000000000000000000' };
            }
            if (method === 'query_user_tokens_registered') {
                return args.tokens.map(() => true);
            }
            if (method === 'storage_balance_bounds') {
                return { min: '1250000000000000000000' };
            }
            throw new Error(`Unexpected view ${method}`);
        }),
    } as unknown as Wallet.Account;
}

function request(wallet = account()) {
    return {
        account: wallet,
        tokenIn: input as Wallet.Token,
        tokenOut: output as Wallet.Token,
        amountIn: '0.001',
        slippage: 0.5,
    };
}

function action(tx: any) {
    return tx.actions[0].functionCall;
}

function args(tx: any) {
    return JSON.parse(Buffer.from(action(tx).args).toString('utf8'));
}

beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => routerData(),
    })) as any;
});

test('requests a bound quote and keeps the signed payload opaque through execution', async () => {
    const quote = await SmartRouterV2.getQuote(request());
    const [url] = (fetch as any).mock.calls[0];
    const params = new URL(url).searchParams;
    expect(params.get('amountIn')).toBe(amountIn);
    expect(params.get('tokenIn')).toBe('wrap.near');
    expect(params.get('tokenOut')).toBe('usdt.tether-token.near');
    expect(params.get('slippage')).toBe('0.005');
    expect(quote.minAmountOutRaw).toBe('4975');
    expect(quote.transactions.map((tx) => action(tx).methodName)).toEqual([
        'near_deposit',
        'ft_transfer_call',
    ]);
    expect(action(quote.transactions[1]).gas.toString()).toBe('300000000000000');
    expect(args(quote.transactions[1])).toEqual({
        receiver_id: 'aggregatedex.near',
        amount: amountIn,
        msg: JSON.stringify({ msg: 'opaque-message', signature: 'opaque-signature' }),
    });
});

test('registers only missing token and internal balances for every route token', async () => {
    globalThis.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => routerData(['wrap.near', 'mid.near', 'usdt.tether-token.near']),
    })) as any;
    const wallet = account((_contract, method, argsValue) => {
        if (method === 'storage_balance_of') {
            if (
                argsValue.account_id === 'example.near' &&
                _contract === 'usdt.tether-token.near'
            ) {
                return null;
            }
            if (
                argsValue.account_id === 'aggregatedex.near' &&
                _contract === 'mid.near'
            ) {
                return null;
            }
            return { total: '1250000000000000000000' };
        }
        if (method === 'storage_balance_bounds') {
            return { min: '1250000000000000000000' };
        }
        if (method === 'query_user_tokens_registered') {
            return argsValue.tokens.map((tokenId: string) => tokenId !== 'mid.near');
        }
        throw new Error(`Unexpected view ${method}`);
    });
    const quote = await SmartRouterV2.getQuote(request(wallet));
    expect(quote.registrationKey.split('|')).toEqual([
        'ft:aggregatedex.near:mid.near',
        'ft:example.near:usdt.tether-token.near',
        'internal:example.near:mid.near',
    ]);
    expect(quote.transactions.map((tx) => action(tx).methodName)).toEqual([
        'storage_deposit',
        'storage_deposit',
        'tokens_storage_deposit',
        'near_deposit',
        'ft_transfer_call',
    ]);
    expect(args(quote.transactions[2]).tokens).toEqual(['mid.near']);
});

test('rejects a quote whose response changes the requested amount', async () => {
    const wallet = account();
    globalThis.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({
            ...routerData(),
            result_data: { ...routerData().result_data, amount_in: '2' },
        }),
    })) as any;
    await expect(SmartRouterV2.getQuote(request(wallet))).rejects.toThrow(
        'Invalid SmartRouter V2 quote'
    );
    expect((wallet.viewFunction as any).mock.calls).toHaveLength(0);
});

test('keeps positive internal balances even when token metadata fails and prepares registered withdrawal', async () => {
    const wallet = account((contract, method) => {
        if (method === 'query_user_exist_balance') {
            return [
                ['usdt.tether-token.near', 'wrap.near'],
                ['0', '100'],
            ];
        }
        if (method === 'ft_metadata') {
            throw new Error('metadata unavailable');
        }
        if (method === 'storage_balance_of') {
            return null;
        }
        if (method === 'storage_balance_bounds') {
            return { min: '1250000000000000000000' };
        }
        throw new Error(`Unexpected view ${contract}:${method}`);
    });
    await expect(SmartRouterV2.getBalances(wallet)).resolves.toEqual([
        { tokenId: 'wrap.near', amount: '100', metadata: null },
    ]);
    const txs = await SmartRouterV2.getWithdrawalTransactions({
        account: wallet,
        tokenId: 'wrap.near',
    });
    expect(txs.map((tx) => action(tx).methodName)).toEqual([
        'storage_deposit',
        'withdraw',
    ]);
    expect(args(txs[1])).toEqual({ token: 'wrap.near', return_near: false });
});

test('requires target delivery and rejects aggregator refund events despite successful receipts', () => {
    const quote = {
        context: { accountId: 'example.near', tokenOutId: 'usdt.tether-token.near' },
        minAmountOutRaw: '4975',
    } as SwapQuote;
    const event = (name: string, data: object[]) =>
        `EVENT_JSON:${JSON.stringify({ event: name, data })}`;
    const delivered = event('withdraw_succeeded', [
        {
            token_id: 'usdt.tether-token.near',
            receive_id: 'example.near',
            amount: '5000',
        },
    ]);
    const outcome = (logs: string[]) => ({
        success: true,
        data: [
            {
                status: { SuccessValue: '' },
                receipts_outcome: [
                    {
                        outcome: {
                            executor_id: 'aggregatedex.near',
                            status: { SuccessValue: '' },
                            logs,
                        },
                    },
                ],
            },
        ],
    });
    expect(
        SmartRouterV2.interpretResult({ result: outcome([delivered]), quote })
    ).toEqual({
        success: true,
        amountOutRaw: '5000',
    });
    expect(
        SmartRouterV2.interpretResult({
            result: outcome([
                event('swap_failed_refund_started', [
                    { token_id: 'usdt.tether-token.near' },
                ]),
                delivered,
            ]),
            quote,
        })
    ).toEqual({
        success: false,
        failReason: 'SmartRouter V2 swap failed or refunded',
    });
    expect(SmartRouterV2.interpretResult({ result: outcome([]), quote })).toEqual({
        success: false,
        unconfirmed: true,
    });
});

test('confirms a completed native NEAR swap without a withdraw_succeeded event', () => {
    // USDC -> NEAR HAR: withdraw_started followed by single_swap_success.
    const quote = {
        context: { accountId: 'example.near', tokenOutId: 'NEAR' },
        minAmountOutRaw: '198217909930382088067682',
    } as SwapQuote;
    const withdrawal = `EVENT_JSON:${JSON.stringify({
        event: 'withdraw_started',
        data: [
            {
                amount: '200220111040789987947154',
                receive_id: 'example.near',
                token_id: 'wrap.near',
                user_id: 'example.near',
            },
        ],
    })}`;
    const result = (logs: string[], status = { SuccessValue: '' }) => ({
        success: true,
        data: [
            {
                final_execution_status: 'FINAL',
                status,
                receipts_outcome: [
                    {
                        outcome: { executor_id: 'aggregatedex.near', status, logs },
                    },
                ],
            },
        ],
    });
    const completed = [
        withdrawal,
        'EVENT_JSON:{"data":[{}],"event":"single_swap_success"}',
    ];
    expect(SmartRouterV2.interpretResult({ result: result(completed), quote })).toEqual({
        success: true,
        amountOutRaw: '200220111040789987947154',
    });
    expect(
        SmartRouterV2.interpretResult({ result: result([withdrawal]), quote })
    ).toEqual({
        success: false,
        unconfirmed: true,
    });
    expect(
        SmartRouterV2.interpretResult({ result: result(completed, {} as any), quote })
    ).toEqual({ success: false, unconfirmed: true });
    expect(
        SmartRouterV2.interpretResult({
            result: result([
                ...completed,
                'EVENT_JSON:{"data":[{}],"event":"withdraw_failed"}',
            ]),
            quote,
        })
    ).toEqual({
        success: false,
        failReason: 'SmartRouter V2 swap failed or refunded',
    });
});
