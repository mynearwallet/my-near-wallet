import * as SUT from './token';

describe('Token utils', () => {
    describe('formatToken', () => {
        it.each([
            ['usdt.fakes.testnet', 'Bridged USDT'],
            ['dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near', 'Bridged USDT'],
            ['usdt.tether-token.near', 'Native USDT'],
            ['usdtt.fakes.testnet', 'Native USDT'],
            ['usdc.fakes.testnet', 'Bridged USDC'],
            ['a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near', 'Bridged USDC'],
            ['something else', 'SOMETHING ELSE'],
        ])('when token contract name is %s it transforms the token symbol to %s without changing anything else', (contractName, expectedSymbol) => {
            const token = {
                contractName,
                onChainFTMetadata: {
                    name: 'stays the same',
                    symbol: 'SOMETHING ELSE'
                }
            } as Wallet.Token


            const result = SUT.formatToken(token);

            expect(result).toEqual({
                contractName,
                onChainFTMetadata: {
                    name: 'stays the same',
                    symbol: expectedSymbol,
                }
            })
        });
    });
});
