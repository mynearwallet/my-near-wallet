const nearApiJsConnection = require('./connectionSingleton');
const E2eTestAccount = require('./E2eTestAccount');
const SelfReloadingE2eTestAccount = require('./SelfReloadingE2eTestAccount');
const { WALLET_NETWORK } = require('../constants');

const getBankAccount = async () => {
    const { BANK_ACCOUNT: accountId, BANK_SEED_PHRASE: seedPhrase } = process.env;
    const account =
        nearApiJsConnection.config.networkId !== WALLET_NETWORK.MAINNET
            ? new SelfReloadingE2eTestAccount(accountId, seedPhrase, {
                  accountId: nearApiJsConnection.config.networkId,
              })
            : new E2eTestAccount(accountId, seedPhrase, {
                  accountId: nearApiJsConnection.config.networkId,
              });

    return account.initialize();
};

function generateTestAccountId() {
    return `test-playwright-account-${Date.now()}-${
        Math.floor(Math.random() * 1000) % 1000
    }`;
}

async function getEnvTestAccount() {
    const { TEST_ACCOUNT_ID, TEST_ACCOUNT_SEED_PHRASE } = process.env;
    const near = await nearApiJsConnection.getConnection();
    const nearApiJsAccount = await near.account(TEST_ACCOUNT_ID);
    return new E2eTestAccount(
        TEST_ACCOUNT_ID || '',
        TEST_ACCOUNT_SEED_PHRASE || '',
        nearApiJsAccount
    );
}

module.exports = {
    getBankAccount,
    generateTestAccountId,
    getEnvTestAccount,
};
