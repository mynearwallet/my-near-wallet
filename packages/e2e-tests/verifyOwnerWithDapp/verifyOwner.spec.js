// @ts-check
const { test, expect } = require('@playwright/test');
const { HomePage } = require('../register/models/Home');
const { getEnvTestAccount } = require('../utils/account');
const guestbookURL = 'http://localhost:4200';

const { describe, beforeAll, beforeEach } = test;

describe('verify owner with guestbook', () => {
    let testAccount;

    beforeAll(async () => {
        testAccount = await getEnvTestAccount();
    });

    beforeEach(async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(
            testAccount.accountId,
            testAccount.seedPhrase
        );
    });

    test('navigates back to guestbook after verify owner', async ({ page }) => {
        // not supported feature
        test.skip();

        await page.goto(guestbookURL);
        await page.getByRole('button', { name: 'Log in' }).click();
        await page.getByText('MyNearWallet').click();

        await expect(page).toHaveURL(/\/login/);

        const currentlyLoggedInUser = await page.textContent('data-test-id=currentUser');
        expect(currentlyLoggedInUser).not.toBe(null);
        await expect(page.locator('.dots')).not.toBeVisible();
        await expect(page.locator('.account-id')).toHaveText(currentlyLoggedInUser || '');

        await page.click('data-test-id=continue-with-current-account');
        await page.click('data-test-id=dapp-grant');

        await page.getByText('Verify Owner').click();
        // Verify Owner Method not supported by MyNearWallet
        await page.on('dialog', (dialog) => {
            console.log(dialog.message());
            return dialog.accept();
        });
    });
});
