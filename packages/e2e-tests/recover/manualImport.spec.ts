// @ts-check
const { test, expect } = require('../playwrightWithFixtures');
const { createPassword } = require('../utils/password');

const { describe } = test;

describe('Account Recovery Using Private Key', () => {
    test('should import manual account success from seedphrase page', async ({
        page,
    }) => {
        await page.goto('/recover-seed-phrase');
        await createPassword(page);
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
