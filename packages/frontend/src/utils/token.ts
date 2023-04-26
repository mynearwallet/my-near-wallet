enum ETokenContractId {
    BridgedUSDTTestnet = 'usdt.fakes.testnet',
    BridgedUSDT = 'dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near',
    NativeUSDTTestnet = 'usdtt.fakes.testnet',
    NativeUSDT = 'usdt.tether-token.near',
    BridgedUSDCTestnet = 'usdc.fakes.testnet',
    BridgedUSDC = 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near',
}

interface ITokenContractIdMap {
    isBridged: boolean;
    symbol: string;
}

const tokenContractIdSymbolMap: { [contractName: string]: ITokenContractIdMap } = {
    [ETokenContractId.BridgedUSDTTestnet]: {
        isBridged: true,
        symbol: 'Bridged USDT',
    },
    [ETokenContractId.BridgedUSDT]: {
        isBridged: true,
        symbol: 'Bridged USDT',
    },
    [ETokenContractId.NativeUSDT]: {
        isBridged: false,
        symbol: 'Native USDT',
    },
    [ETokenContractId.NativeUSDTTestnet]: {
        isBridged: false,
        symbol: 'Native USDT',
    },
    [ETokenContractId.BridgedUSDC]: {
        isBridged: true,
        symbol: 'Bridged USDC',
    },
    [ETokenContractId.BridgedUSDCTestnet]: {
        isBridged: true,
        symbol: 'Bridged USDC',
    },
};

export const formatToken = (token: Wallet.Token) => {
    const { contractName } = token;

    if (Object.keys(tokenContractIdSymbolMap).includes(contractName)) {
        return {
            ...token,
            onChainFTMetadata: {
                ...token.onChainFTMetadata,
                ...tokenContractIdSymbolMap[contractName],
            },
        };
    }

    return token;
};
