// @ts-check
const { test, expect } = require('@playwright/test');

const { getEnvTestAccount } = require('../utils/account');
const { createPassword } = require('../utils/password');
const nearApiJsConnection = require('../utils/connectionSingleton');
const { WALLET_NETWORK } = require('../constants');

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

    test('should show error when import deleted private key account', async ({
        page,
    }) => {
        if (nearApiJsConnection.config?.networkId === WALLET_NETWORK.MAINNET) {
            test.skip();
        }
        await page.goto('/recover-seed-phrase');

        await createPassword(page);

        // testprivatekey.testnet
        await page.fill(
            'data-test-id=seedPhraseRecoveryInput',
            'first scheme behind humor senior fantasy fever wine ask vocal certain judge'
        );
        await page.click('data-test-id=seedPhraseRecoverySubmitButton');

        await expect(page.locator('data-test-id=alertContainer')).toHaveText(
            /The imported key does not match the public key/
        );
    });

    test('should able import implicit zero balance for deleted account', async ({
        page,
    }) => {
        if (nearApiJsConnection.config?.networkId === WALLET_NETWORK.MAINNET) {
            test.skip();
        }
        await page.goto('/recover-seed-phrase');

        await createPassword(page);

        // testdelete.testnet
        await page.fill(
            'data-test-id=seedPhraseRecoveryInput',
            'wreck brand tape bachelor network good glass scrap detail young mind cycle'
        );
        await page.click('data-test-id=seedPhraseRecoverySubmitButton');

        await expect(page.locator('data-test-id=modalContainer')).toHaveText(
            /The following account was successfully imported using the passphrase you provided:09be04986226a2cf13ed713f4e06864f38efe43af852b6cc4243d719aeaade8a/
        );
    });

    test('should able import implicit zero balance for not funded new account', async ({
        page,
    }) => {
        if (nearApiJsConnection.config?.networkId === WALLET_NETWORK.MAINNET) {
            test.skip();
        }
        await page.goto('/recover-seed-phrase');

        await createPassword(page);

        await page.fill(
            'data-test-id=seedPhraseRecoveryInput',
            'false know tube produce tunnel sheriff radio kick ordinary rather alone kiss'
        );
        await page.click('data-test-id=seedPhraseRecoverySubmitButton');

        await expect(page.locator('data-test-id=modalContainer')).toHaveText(
            /The following account was successfully imported using the passphrase you provided:fd8abdb79b7e7fd13f48a705d1a3fb53390461339f718c365c13ef14008c1bfa/
        );
    });
});
