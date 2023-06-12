// @ts-check
const { test, expect } = require('../playwrightWithFixtures');
const { HomePage } = require('../register/models/Home');
const { testDappURL } = require('../utils/config');
const { LoginPage } = require('./models/Login');

const { describe, beforeAll, afterAll, beforeEach } = test;

describe('Login with Dapp', () => {
    let testAccount;

    beforeAll(async ({ bankAccount }) => {
        testAccount = bankAccount.spawnRandomSubAccountInstance();
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

    test('navigates to login with dapp page requesting a full access key', async ({
        page,
    }) => {
        const loginPage = new LoginPage(page);
        await loginPage.navigateToFAKFlow();

        await expect(page).toHaveURL(/\/login/);

        const currentlyLoggedInUser = await page.textContent('data-test-id=currentUser');
        expect(currentlyLoggedInUser).not.toBe(null);
        await expect(page.locator('.dots')).not.toBeVisible();
        await expect(page.locator('data-test-id=type-fullAccess')).toBeVisible();
        await expect(page.locator('.account-id')).toHaveText(currentlyLoggedInUser || '');
    });

    test('navigates back to dapp with access key when access is granted', async ({
        page,
    }) => {
        const loginPage = new LoginPage(page);
        const testDappPage = await loginPage.navigateToFAKFlow();

        await loginPage.allowFullAccess(testAccount.accountId);

        await expect(page).toHaveURL(new RegExp(testDappURL));

        await expect(page.locator('data-test-id=testDapp-currentUser')).toHaveText(
            new RegExp(testAccount.accountId)
        );

        const pendingkeyLocalStorageKeys = await testDappPage.getPendingAccessKeys();
        expect(pendingkeyLocalStorageKeys).toHaveLength(0);

        const accesskeyLocalStorageKey = await testDappPage.getAccessKeyForAccountId(
            testAccount.accountId
        );
        expect(accesskeyLocalStorageKey).toBeTruthy();
    });

    test('navigates back to dapp when access is denied', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const testDappPage = await loginPage.navigateToFAKFlow();

        await loginPage.denyAccess();

        await expect(page).toHaveURL(new RegExp(testDappURL));

        const pendingkeyLocalStorageKeys = await testDappPage.getPendingAccessKeys();
        expect(pendingkeyLocalStorageKeys).not.toHaveLength(0);

        const accesskeyLocalStorageKey = await testDappPage.getAccessKeyForAccountId(
            testAccount.accountId
        );
        expect(accesskeyLocalStorageKey).toBeFalsy();

        await expect(page.locator('data-test-id=testDapp-signInBtn')).toBeVisible();
    });
});
