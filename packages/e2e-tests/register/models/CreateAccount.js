const { WALLET_NETWORK } = require('../../constants');
const nearApiJsConnection = require('../../utils/connectionSingleton');
const { createPassword } = require('../../utils/password');

class CreateAccountPage {
    constructor(page) {
        this.page = page;
    }
    async navigate() {
        await this.page.goto('/create');
    }
    async acceptTerms() {
        if (nearApiJsConnection.config.networkId === WALLET_NETWORK.MAINNET) {
            await this.page.click('data-test-id=acceptTermsButton');
        }
    }
    async submitAccountId(accountId, options) {
        const withPasswordPage = options?.withCreatePasswordPage ?? false;
        if (withPasswordPage) {
            await createPassword(this.page);
        }
        await this.page.type('data-test-id=createAccount.accountIdInput', accountId);
        await this.page.click('data-test-id=reserveAccountIdButton');
    }
}

module.exports = { CreateAccountPage };
