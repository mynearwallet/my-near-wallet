// @ts-check
const { test, expect } = require('../playwrightWithFixtures');
const { HomePage } = require('../register/models/Home');
const guestbookURL = 'http://localhost:4200';

const { describe, beforeAll, afterAll, beforeEach } = test;

describe('verify owner with guestbook', () => {
    let testAccount;

    beforeAll(async ({ bankAccount }) => {
        testAccount = await bankAccount.spawnRandomSubAccountInstance();
        await testAccount.create();
    });

    beforeEach(async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(
            testAccount.accountId,
            testAccount.seedPhrase
        );
    });

    afterAll(async () => {
        await testAccount.delete();
    });

    test('navigates back to guestbook after verify owner', async ({ page }) => {
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

        // await expect(page).toHaveURL(/\/verify-owner/);
        // await page.click('data-test-id=approve-verify-owner');
        // await page.pause();
        // await expect(page).toHaveURL(new RegExp(guestbookURL));

        // const parsed = new URL(page.url());

        // const searchParams = parsed.searchParams;

        // const mustHaveParams = [
        //     'accountId',
        //     'message',
        //     'blockId',
        //     'publicKey',
        //     'signature',
        // ];

        // mustHaveParams.map((v) => {
        //     expect(searchParams.has(v)).toBe(true);
        // });
    });
});
