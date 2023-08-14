// @ts-check
const { NftPage } = require('./models/NftPage');
const { test, expect } = require('../playwrightWithFixtures');
const { HomePage } = require('../register/models/Home');
const NftAccountManager = require('../utils/NftAccountManager');

const { describe, beforeAll, afterAll, beforeEach } = test;

describe('NFT flow', () => {
    /**
     * @type {NftAccountManager}
     */
    let nftAccountManager;

    beforeAll(async ({ bankAccount }) => {
        nftAccountManager = new NftAccountManager(bankAccount);
        await nftAccountManager.initialize();
    });

    beforeEach(async ({ page }) => {
        const homePage = new HomePage(page);
        const { nftSenderAccount } = nftAccountManager;
        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(
            nftSenderAccount.accountId,
            nftSenderAccount.seedPhrase
        );
    });

    afterAll(async () => {
        if (nftAccountManager) {
            await nftAccountManager.deleteAccounts();
        }
    });

    test('able to view and send NFT', async ({ page }) => {
        const nftPage = new NftPage(page);
        await nftPage.navigateToNftPage();
        // this text is hardcoded in the minted NFT
        await expect(page.getByText('Example NEAR non-fungible token1')).toBeVisible();
        await expect(page.getByRole('img', { name: 'NFT' })).toBeVisible();
        await expect(page.getByText('Olympus Mons')).toBeVisible();
        await nftPage.clickFirstNft();
        await nftPage.transferCurrentNftToAccount(
            nftAccountManager.nftReceiverAccount.accountId
        );
        const tokenForReceiver =
            await nftAccountManager.nftContractAccount.nearApiJsAccount?.viewFunction(
                nftAccountManager.nftContractAccount.accountId,
                'nft_tokens_for_owner',
                { account_id: nftAccountManager.nftReceiverAccount.accountId }
            );

        expect(tokenForReceiver[0].owner_id).toBe(
            nftAccountManager.nftReceiverAccount.accountId
        );
    });
});
