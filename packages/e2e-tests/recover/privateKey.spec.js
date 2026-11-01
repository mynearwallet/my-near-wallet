// @ts-check
const { test, expect } = require('@playwright/test');

const { getEnvTestAccount } = require('../utils/account');
const { getKeyPairFromSeedPhrase } = require('../utils/helpers');
const { createPassword } = require('../utils/password');

const { describe, beforeAll } = test;

describe('Account Recovery Using Private Key', () => {
    let testAccount;

    beforeAll(async () => {
        testAccount = await getEnvTestAccount();
    });

    test('navigates to private key page successfully', async ({ page }) => {
        // From Phase 2 the guest landing no longer links to import; the route stays open.
        await page.goto('/recover-account');

        await createPassword(page);

        await page.click('data-test-id=recoverAccountWithPrivateKey');

        await expect(page).toHaveURL(/\/recover-private-key$/);
    });

    test('recovers account using private key', async ({ page }) => {
        await page.goto('/recover-private-key');
        const keyPair = getKeyPairFromSeedPhrase(testAccount.seedPhrase);

        await createPassword(page);
        await page.fill('data-test-id=privateKeyRecoveryInput', keyPair.toString());
        await page.click('data-test-id=privateKeyRecoverySubmitButton');

        await expect(page).toHaveURL(/\/$/);
        await expect(page.locator('data-test-id=currentUser >> visible=true')).toHaveText(
            testAccount.accountId
        );
    });
});
