// @todo find a better way to determine such values
const NEAR_DEPOSIT_FEE = 0.003
const NEAR_WITHDRAW_FEE = 0.003

const NEP141_TOKENS = {
    TESTNET: [
        {
            id: 'usdt.fakes.testnet',
            symbol: 'USDT',
        }
    ]
}

module.exports = {
    NEAR_DEPOSIT_FEE,
    NEAR_WITHDRAW_FEE,
    NEP141_TOKENS,
};
