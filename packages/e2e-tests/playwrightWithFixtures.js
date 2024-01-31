const base = require('@playwright/test');
const { BN } = require('bn.js');

// const { WALLET_NETWORK } = require('./constants');
const { getBankAccount } = require('./utils/account');
// const nearApiJsConnection = require('./utils/connectionSingleton');
const E2eTestAccount = require('./utils/E2eTestAccount');
const { getTestAccountSeedPhrase, getWorkerAccountId } = require('./utils/helpers');
// const SelfReloadingE2eTestAccount = require('./utils/SelfReloadingE2eTestAccount');

/**
 * @type {base.TestType<base.PlaywrightTestArgs & base.PlaywrightTestOptions,{bankAccount: E2eTestAccount | SelfReloadingE2eTestAccount}>}
 */
const test = base.test.extend({
    bankAccount: [
        // eslint-disable-next-line no-empty-pattern
        async ({}, use, workerInfo) => {
            await new Promise((resolve) => {
                const timeout =
                    (workerInfo.workerIndex % 8) * 500 + Math.ceil(Math.random() * 500);

                console.log(
                    `Worker ${workerInfo.workerIndex} waiting for ${timeout}ms to avoid collissions`
                );

                setTimeout(resolve, timeout);
            });

            const bankAccount = await getBankAccount();
            const workerBankAccountId = getWorkerAccountId(workerInfo.workerIndex);
            const workerBankAccountSeedphrase =
                getTestAccountSeedPhrase(workerBankAccountId);

            const workerBankAccount = await new E2eTestAccount(
                workerBankAccountId,
                workerBankAccountSeedphrase,
                bankAccount.nearApiJsAccount
            ).connectOrCreate({
                amount: '200',
            });
            const { total: startBalance } = await workerBankAccount.getUpdatedBalance();
            process.env.workerBankStartBalance = startBalance;

            await use(workerBankAccount);

            const { total: endBalance } = await workerBankAccount.getUpdatedBalance();
            const amountSpent = new BN(process.env.workerBankStartBalance)
                .sub(new BN(endBalance))
                .toString();
            console.log(
                JSON.stringify([
                    'WorkerExpenseLog',
                    {
                        workerBankAccount: workerBankAccount.accountId,
                        amountSpent,
                        workerIndex: workerInfo.workerIndex,
                    },
                ])
            );

            await workerBankAccount.delete();
        },
        { scope: 'worker', auto: true },
    ],
});

module.exports = {
    ...base,
    test,
};
