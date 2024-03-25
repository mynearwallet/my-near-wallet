// @ts-check
const { test, expect } = require('../playwrightWithFixtures');

const { describe, beforeAll, afterAll } = test;

describe('Account Recovery Using Private Key', () => {
    let testAccount;

    beforeAll(async ({ bankAccount }) => {
        testAccount = bankAccount.spawnRandomSubAccountInstance();
        await testAccount.create();
    });

    afterAll(async () => {
        await testAccount.delete();
    });

    test('should import manual account success from seedphrase page', async ({
        page,
    }) => {
        await page.goto('/recover-seed-phrase');
        // uncomment after merge pr 212
        // await createPassword(page);
        await page.click('data-test-id=buttonOpenManualImportModal');

        await page.fill(
            'data-test-id=manualImportInputSeedPhrase',
            process.env.BANK_SEED_PHRASE
        );
        await page.fill(
            'data-test-id=manualImportInputAccountId',
            process.env.BANK_ACCOUNT
        );

        await page.click('data-test-id=manualImportSubmitButton');

        await expect(page).toHaveURL(/\/$/);
    });
});
