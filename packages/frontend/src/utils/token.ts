export const BRIDGED_CONSTANT = 'Bridged';

enum NativeBridgeTypes {
    BridgedUSDTTestnet = 'usdt.fakes.testnet',
    BridgedUSDT = 'dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near',
    NativeUSDTTestnet = 'usdtt.fakes.testnet',
    NativeUSDT = 'usdt.tether-token.near',
    BridgedUSDCTestnet = 'usdc.fakes.testnet',
    BridgedUSDC = 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near',
}

const nativeBridgeTokenSymbolMap: { [contractName: string]: string } = {
    [NativeBridgeTypes.BridgedUSDTTestnet]: `${BRIDGED_CONSTANT} USDT`,
    [NativeBridgeTypes.BridgedUSDT]: `${BRIDGED_CONSTANT} USDT`,
    [NativeBridgeTypes.NativeUSDT]: 'Native USDT',
    [NativeBridgeTypes.NativeUSDTTestnet]: 'Native USDT',
    [NativeBridgeTypes.BridgedUSDC]: `${BRIDGED_CONSTANT} USDC`,
    [NativeBridgeTypes.BridgedUSDCTestnet]: `${BRIDGED_CONSTANT} USDC`,
}

export const formatToken = (token: Wallet.Token) => {
    const { contractName } = token;

    if(Object.keys(nativeBridgeTokenSymbolMap).includes(contractName)) {
        return {
            ...token,
            onChainFTMetadata: {
                ...token.onChainFTMetadata,
                symbol: nativeBridgeTokenSymbolMap[contractName]
            }
        };
    }

    return token;
};
