import { parseTokenAmount } from '../../utils/amounts';
import * as utils from './utils';

describe('Ref Finance utils', () => {
    test('should correctly calculate price impact percentage', () => {
        const token0 = {
            id: 'wrap.testnet',
            decimals: 24,
        };
        const token1 = {
            id: 'usdc.fakes.testnet',
            decimals: 18,
        };

        expect(
            utils.getPriceImpactPercent({
                pool: {
                    total_fee: 20,
                    token_account_ids: [token1.id, token0.id],
                    amounts: [
                        parseTokenAmount(2_000_000, token1.decimals),
                        parseTokenAmount(1_000, token0.decimals),
                    ],
                },
                tokenInId: token1.id,
                tokenInDecimals: token1.decimals,
                amountIn: 10_000,
                tokenOutId: token0.id,
                tokenOutDecimals: token0.decimals,
            })
        ).toBe('0.5');

        expect(
            utils.getPriceImpactPercent({
                pool: {
                    total_fee: 20,
                    token_account_ids: [token1.id, token0.id],
                    amounts: [
                        parseTokenAmount(2_000_000, token1.decimals),
                        parseTokenAmount(1_000, token0.decimals),
                    ],
                },
                tokenInId: token1.id,
                tokenInDecimals: token1.decimals,
                amountIn: 100_000,
                tokenOutId: token0.id,
                tokenOutDecimals: token0.decimals,
            })
        ).toBe('4.75');

        expect(
            utils.getPriceImpactPercent({
                pool: {
                    total_fee: 20,
                    token_account_ids: [token1.id, token0.id],
                    amounts: [
                        parseTokenAmount(2_000_000, token1.decimals),
                        parseTokenAmount(1_000, token0.decimals),
                    ],
                },
                tokenInId: token0.id,
                tokenInDecimals: token0.decimals,
                amountIn: 50,
                tokenOutId: token1.id,
                tokenOutDecimals: token1.decimals,
            })
        ).toBe('4.75');
    });
});
