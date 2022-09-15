// @todo find a better way to determine such values
const NEAR_DEPOSIT_FEE = 0.003;
const NEAR_WITHDRAW_FEE = 0.003;
const SWAP_FEE = 0.008;

const NEP141_TOKENS = {
    TESTNET: [
        {
            id: 'aurora.fakes.testnet',
            symbol: 'AURORA',
            name: 'Aurora',
            decimals: 18,
        },
        // {
        //     id: 'usdt.fakes.testnet',
        //     symbol: 'USDT',
        //     name: 'Tether USD',
        //     decimals: 6,
        // },
    ],
};

const NEP141_TOKEN_PAIRS = {
    TESTNET: [
        {
            token0: {
                id: 'aurora.fakes.testnet',
                symbol: 'AURORA',
                name: 'Aurora',
                decimals: 18,
            },
            token1: {
                id: 'dai.fakes.testnet',
                symbol: 'DAI',
                name: 'Dai Stablecoin',
                decimals: 18,
            },
        }
    ]
};

module.exports = {
    NEAR_DEPOSIT_FEE,
    NEAR_WITHDRAW_FEE,
    SWAP_FEE,
    NEP141_TOKENS,
    NEP141_TOKEN_PAIRS,
};
