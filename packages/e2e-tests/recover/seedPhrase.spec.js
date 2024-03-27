// @ts-check
const { test, expect } = require('@playwright/test');

const { getEnvTestAccount } = require('../utils/account');
const { createPassword } = require('../utils/password');

const { describe, beforeAll } = test;

describe('Account Recovery Using Seed Phrase', () => {
    let testAccount;

    beforeAll(async () => {
        testAccount = await getEnvTestAccount();
    });

    test('navigates to seed phrase page successfully', async ({ page }) => {
        await page.goto('/');

        await page.click('data-test-id=homePageImportAccountButton');

        await createPassword(page);

        await page.click('data-test-id=recoverAccountWithPassphraseButton');

        await expect(page).toHaveURL(/\/recover-seed-phrase$/);
    });

    test('recovers account using seed phrase', async ({ page }) => {
        await page.goto('/recover-seed-phrase');

        await createPassword(page);

        await page.fill('data-test-id=seedPhraseRecoveryInput', testAccount.seedPhrase);
        await page.click('data-test-id=seedPhraseRecoverySubmitButton');

        await expect(page).toHaveURL(/\/$/);
        await expect(page.locator('data-test-id=currentUser >> visible=true')).toHaveText(
            testAccount.accountId
        );
    });
});
