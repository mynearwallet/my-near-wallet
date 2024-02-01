const { getKeyPairFromSeedPhrase } = require('../../utils/helpers');

class HomePage {
    constructor(page) {
        this.page = page;
    }
    async close() {
        await this.page.close();
    }
    async navigate() {
        await this.page.goto('/');
    }
    async clickCreateAccount() {
        await this.page.click('data-test-id=landingPageCreateAccount');
    }
    async clickSendButton() {
        await this.page.click('data-test-id=balancesTab.send');
    }
    async loginWithKeyPairLocalStorage(accountId, keyPair) {
        const serializedKeyPair = keyPair.toString();
        await this.page.evaluate(
            async ([accountId, serializedKeyPair]) => {
                window.localStorage.setItem(
                    `nearlib:keystore:${accountId}:default`,
                    serializedKeyPair
                );
                const currentlySetAccounts = window.localStorage.getItem(
                    '_4:wallet:accounts_v2'
                );
                window.localStorage.setItem(
                    '_4:wallet:accounts_v2',
                    JSON.stringify({
                        ...(currentlySetAccounts ? JSON.parse(currentlySetAccounts) : {}),
                        [accountId]: true,
                    })
                );
                window.localStorage.setItem('_4:wallet:active_account_id_v2', accountId);
            },
            [accountId, serializedKeyPair]
        );
    }
    async loginWithSeedPhraseLocalStorage(accountId, seedPhrase) {
        await this.loginWithKeyPairLocalStorage(
            accountId,
            getKeyPairFromSeedPhrase(seedPhrase)
        );
    }
    /**
     *
     * @returns {Promise<string>}
     */
    async getNearBalanceInNear() {
        const rawBalance = await this.page.textContent(
            'data-test-id=walletHomeNearBalance'
        );

        const mixed = rawBalance.replace('—', '').split(' ')[0];

        if (mixed.includes('$')) {
            return mixed.split('$')[0];
        }
        return mixed;
    }

    async loginAndNavigate(accountId, seed) {
        await this.navigate();
        await this.loginWithSeedPhraseLocalStorage(accountId, seed);
        await this.navigate();
    }
}
module.exports = { HomePage };
