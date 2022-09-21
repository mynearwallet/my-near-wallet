import { parseTokenAmount } from '../../utils/amounts';
import * as utils from './utils';

describe('Ref Finance utils', () => {
    test('should correctly calculate price impact percentage', () => {
        expect(
            utils.getPriceImpactPercent({
                pool: {
                    total_fee: 20,
                    token_account_ids: ['usdc.fakes.testnet', 'wrap.testnet'],
                    amounts: [
                        parseTokenAmount(2_000_000, 18),
                        parseTokenAmount(1_000, 24),
                    ],
                },
                tokenInId: 'usdc.fakes.testnet',
                tokenInDecimals: 18,
                amountIn: 10_000,
                tokenOutId: 'wrap.testnet',
                tokenOutDecimals: 24,
            })
        ).toBe('0.5');

        expect(
            utils.getPriceImpactPercent({
                pool: {
                    token_account_ids: ['usdc.fakes.testnet', 'wrap.testnet'],
                    amounts: [
                        parseTokenAmount(2_000_000, 18),
                        parseTokenAmount(1_000, 24),
                    ],
                },
                tokenInId: 'usdc.fakes.testnet',
                tokenInDecimals: 18,
                amountIn: 100_000,
                tokenOutId: 'wrap.testnet',
                tokenOutDecimals: 24,
            })
        ).toBe('4.76');
    });
});
