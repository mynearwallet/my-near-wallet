import { transactions } from 'near-api-js';
import { JsonRpcProvider } from 'near-api-js/lib/providers';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { wallet } from '../../utils/wallet';

import {
    fromRaw,
    getTransactionFee,
    getUsdPriceImpact,
    requiresQuoteReview,
    SwapQuote,
    toRaw,
} from './quotes';

jest.mock('../../utils/wallet', () => ({
    wallet: {
        connection: {
            provider: {
                block: jest.fn(async () => ({
                    header: { hash: 'block', gas_price: '100000000' },
                })),
                experimental_protocolConfig: jest.fn(),
            },
        },
    },
}));

const runtimeConfig = {
    min_gas_purchase_price: '1000000000',
    transaction_costs: {
        action_receipt_creation_config: {
            send_sir: 108059500000,
            send_not_sir: 108059500000,
            execution: 108059500000,
        },
        action_creation_config: {
            function_call_cost: {
                send_sir: 200000000000,
                send_not_sir: 200000000000,
                execution: 780000000000,
            },
            function_call_cost_per_byte: {
                send_sir: 2235934,
                send_not_sir: 47683715,
                execution: 2235934,
            },
        },
    },
};
const account = { accountId: 'alice.near' } as Wallet.Account;

beforeEach(() => {
    jest.mocked(wallet.connection.provider.experimental_protocolConfig).mockResolvedValue(
        {
            runtime_config: {
                ...runtimeConfig,
                storage_amount_per_byte: '10000000000000000000',
            },
        }
    );
});

const context = {
    accountId: 'alice.near',
    tokenInId: 'a.near',
    tokenOutId: 'b.near',
    amountIn: '100',
    slippage: '1',
};
const quote = (
    source: SwapQuote['source'],
    output = '100000000000000000000001'
): SwapQuote => ({
    source,
    context,
    amountOutRaw: output,
    minAmountOutRaw: '99',
    amountOut: '100',
    minAmountOut: '99',
    outputDecimals: 0,
    priceImpactPercent: '1',
    swapFee: null,
    estimatedFee: '0.001',
    requiredNearBalance: '0.01',
    transactions: [],
    registrationKey: '',
    routeTokenIds: ['a.near', 'b.near'],
    execution: {},
});

describe('swap quote arithmetic and review', () => {
    test('preserves raw precision and rejects amounts that would round up', () => {
        expect(toRaw('1.000000000000000000000001', 24)).toBe('1000000000000000000000001');
        expect(fromRaw('1000000000000000000000001', 24)).toBe(
            '1.000000000000000000000001'
        );
        expect(() => toRaw('0.0000001', 6)).toThrow('precision');
    });

    test('uses USD value for the high-impact boundary', () => {
        const impact = (amountOut: string) =>
            getUsdPriceImpact({
                amountIn: '100',
                amountOut,
                priceIn: '1',
                priceOut: '1',
            });
        expect(impact('94')).toBe('6');
        expect(Number(impact('93.999999'))).toBeGreaterThan(6);
    });

    test('reviews a worse minimum or a higher balance requirement', () => {
        const previous = quote('v2');
        expect(requiresQuoteReview(previous, { ...previous })).toBe(false);
        expect(
            requiresQuoteReview(previous, { ...previous, minAmountOutRaw: '98' })
        ).toBe(true);
        expect(
            requiresQuoteReview(previous, {
                ...previous,
                requiredNearBalance: '0.010000000000000000000001',
            })
        ).toBe(true);
    });

    test('prices 300 Tgas transfer, reserves purchase gas, and excludes native input principal', async () => {
        const sendJsonRpc = jest.fn(async () => ({ runtime_config: runtimeConfig }));
        jest.mocked(
            wallet.connection.provider.experimental_protocolConfig
        ).mockImplementationOnce(
            JsonRpcProvider.prototype.experimental_protocolConfig.bind({ sendJsonRpc })
        );
        const txs = [
            {
                receiverId: 'wrap.near',
                actions: [
                    transactions.functionCall(
                        'storage_deposit',
                        {},
                        '30000000000000',
                        '1250000000000000000000'
                    ),
                    transactions.functionCall(
                        'near_deposit',
                        {},
                        '30000000000000',
                        '1000000000000000000000000'
                    ),
                ],
            },
            {
                receiverId: 'usdc.near',
                actions: [
                    transactions.functionCall(
                        'ft_transfer_call',
                        new Uint8Array(1239),
                        '300000000000000',
                        '1'
                    ),
                ],
            },
        ];
        expect(await getTransactionFee(account, txs, {
            nativePrincipalRaw: '1000000000000000000000000',
        })).toEqual({
            estimatedFee: '0.037593643466861400000001',
            requiredNearBalance: '0.363896738436873000000001',
        });
        expect(sendJsonRpc).toHaveBeenCalledWith('EXPERIMENTAL_protocol_config', {
            finality: 'final',
        });
    });
});
