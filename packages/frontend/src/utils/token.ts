export const BRIDGED_CONSTANT = 'Bridged';

export const formatToken = (token: Wallet.Token) => {
    const { contractName } = token;

    const isBridgedUSDT = contractName === 'usdt.fakes.testnet' || contractName === 'dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near';
    const isNativeUSDT = contractName === 'usdt.tether-token.near' || contractName === 'usdtt.fakes.testnet';
    const isBridgedUSDC = contractName === 'usdc.fakes.testnet' || contractName === 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near';


    if (isBridgedUSDT) {
        return {
            ...token,
            onChainFTMetadata: {
                ...token.onChainFTMetadata,
                symbol: `${BRIDGED_CONSTANT} USDT`
            }
        };
    }

    if (isNativeUSDT) {
        return {
            ...token,
            onChainFTMetadata: {
                ...token.onChainFTMetadata,
                symbol: 'Native USDT'
            }
        };
    }

    if (isBridgedUSDC) {
        return {
            ...token,
            onChainFTMetadata: {
                ...token.onChainFTMetadata,
                symbol: `${BRIDGED_CONSTANT} USDC`
            }
        };
    }

    return token;
};
