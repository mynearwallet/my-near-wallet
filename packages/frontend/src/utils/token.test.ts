import * as SUT from './token';

describe('Token utils', () => {
    describe('formatToken', () => {
        it.each([
            ['usdt.fakes.testnet', { isBridged: true, symbol: 'Bridged USDT' }],
            [
                'dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near',
                { isBridged: true, symbol: 'Bridged USDT' },
            ],
            ['usdt.tether-token.near', { isBridged: false, symbol: 'Native USDT' }],
            ['usdtt.fakes.testnet', { isBridged: false, symbol: 'Native USDT' }],
            ['usdc.fakes.testnet', { isBridged: true, symbol: 'Bridged USDC' }],
            [
                'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near',
                { isBridged: true, symbol: 'Bridged USDC' },
            ],
            ['something else', { symbol: 'SOMETHING ELSE' }],
        ])(
            'when token contract name is %s it transforms the token to %o without changing anything else',
            (contractName, expected) => {
                const token = {
                    contractName,
                    onChainFTMetadata: {
                        name: 'stays the same',
                        symbol: 'SOMETHING ELSE',
                    },
                } as Wallet.Token;

                const result = SUT.formatToken(token);

                expect(result).toEqual({
                    contractName,
                    onChainFTMetadata: {
                        name: 'stays the same',
                        ...expected,
                    },
                });
            }
        );
    });
});
