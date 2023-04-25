export const BRIDGED_CONSTANT = 'Bridged';

interface ISpecialTokenMeta {
    symbol: string;
}

const specialTokenMetaMap: { [contractName: string]: ISpecialTokenMeta } = {
    // USDT Bridged
    ['usdt.fakes.testnet']: {
        symbol: `${BRIDGED_CONSTANT} USDT`,
    },
    // USDT Native
    ['usdt.tether-token.near']: {
        symbol: 'Native USDT',
    },
    // USDC Bridged
    ['usdc.fakes.testnet']: {
        symbol: `${BRIDGED_CONSTANT} USDC`,
    },
};

// USDT Bridged
specialTokenMetaMap['dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near'] =
    specialTokenMetaMap['usdt.fakes.testnet'];

// USDT Native
specialTokenMetaMap['usdtt.fakes.testnet'] =
    specialTokenMetaMap['usdt.tether-token.near'];

// USDC Bridged
specialTokenMetaMap['a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near'] =
    specialTokenMetaMap['usdc.fakes.testnet'];

export const formatToken = (token: Wallet.Token): Wallet.Token => {
    const { contractName } = token;

    return {
        ...token,
        onChainFTMetadata: {
            ...token.onChainFTMetadata,
            ...specialTokenMetaMap[contractName],
        },
    };
};
