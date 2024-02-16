// @ts-check
const { StakeUnstakePage } = require('./models/StakeUnstake');
const {
    LOCKUP_CONFIGS: { FULLY_UNVESTED_CONFIG },
} = require('../constants');
const { test, expect } = require('../playwrightWithFixtures');
const { HomePage } = require('../register/models/Home');
const { generateNUniqueRandomNumbersInRange } = require('../utils/helpers');

const { describe, afterEach, beforeEach } = test;

describe('Lockup stake and unstake', () => {
    let testAccount, lockupAccount;

    beforeEach(async ({ page, bankAccount }) => {
        testAccount = await bankAccount
            .spawnRandomSubAccountInstance()
            .create({ amount: '6.0' });
        lockupAccount = await testAccount.createTestLockupSubAccountInstance(
            FULLY_UNVESTED_CONFIG
        );
        const homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(
            testAccount.accountId,
            testAccount.seedPhrase
        );
    });

    afterEach(async () => {
        lockupAccount &&
            (await lockupAccount.delete().then(() => testAccount && testAccount.delete));
    });

    test('Is able to run normal staking flow still', async ({ page }) => {
        const stakeUnstakePage = new StakeUnstakePage(page);
        await stakeUnstakePage.navigate();

        await stakeUnstakePage.clickStakeButton();
        const validatorLastIndex =
            (await stakeUnstakePage.getNumberOfSelectableValidators()) - 1;
        const [randomValidatorIndex] = generateNUniqueRandomNumbersInRange(
            { from: 0, to: validatorLastIndex },
            1
        );
        await stakeUnstakePage.runStakingFlowWithAmount(0.1, randomValidatorIndex);
        await page
            .locator('data-test-id=stakingPageUnstakingButton')
            .click({ trial: true });
        await expect(
            page.locator('data-test-id=stakingPageTotalStakedAmount')
        ).toHaveText(/0.1 NEAR/);
    });

    test('Stakes and unstakes with locked funds and cant stake with multiple validators simultaneously', async ({
        page,
    }) => {
        const stakeUnstakePage = new StakeUnstakePage(page);
        await stakeUnstakePage.navigate();
        await page.locator('data-test-id=stakeMyTokensButton').click({
            trial: true,
        });
        await stakeUnstakePage.selectNthAccount(0);
        await expect(
            page.locator('data-test-id=stakingPageTotalStakedAmount')
        ).toHaveText(/0 NEAR/);
        await stakeUnstakePage.selectNthAccount(1);
        await expect(
            page.locator('data-test-id=stakingPageTotalStakedAmount')
        ).toHaveText(/0 NEAR/);

        await stakeUnstakePage.clickStakeButton();
        const validatorLastIndex =
            (await stakeUnstakePage.getNumberOfSelectableValidators()) - 1;
        const randomValidatorIndexes = generateNUniqueRandomNumbersInRange(
            { from: 0, to: validatorLastIndex },
            2
        );

        await stakeUnstakePage.runStakingFlowWithAmount(0.2, randomValidatorIndexes[0]);

        await stakeUnstakePage.selectNthAccount(0);
        await expect(
            page.locator('data-test-id=stakingPageTotalStakedAmount')
        ).toHaveText(/0 NEAR/);
        await stakeUnstakePage.selectNthAccount(1);
        await page.locator('data-test-id=stakingPageUnstakingButton').click({
            trial: true,
            timeout: 60_000,
        });
        await expect(
            page.locator('data-test-id=stakingPageTotalStakedAmount')
        ).toHaveText(/0.2 NEAR/);

        await stakeUnstakePage.clickStakeButton();
        await stakeUnstakePage.stakeWithValidator(randomValidatorIndexes[1]);
        await expect(
            page.locator('data-test-id=cantStakeWithValidatorContainer')
        ).toBeVisible();

        await stakeUnstakePage.clickViewCurrentValidator();
        await stakeUnstakePage.clickValidatorPageUnstakeButton();
        await stakeUnstakePage.submitStakeWithMaxAmount();
        await stakeUnstakePage.confirmStakeOnModal();
        await stakeUnstakePage.returnToDashboard();

        await stakeUnstakePage.selectNthAccount(0);
        // artificial wait here because frontend is too slow to react
        await page.waitForTimeout(5000);
        await expect(
            page.locator('data-test-id=stakingPageTotalStakedAmount')
        ).toHaveText(/0 NEAR/);
        await stakeUnstakePage.selectNthAccount(1);
        await expect(async () => {
            await expect(
                page.locator('data-test-id=stakingPageTotalStakedAmount')
            ).toHaveText(new RegExp('0 NEAR'));
        }).toPass();
        await stakeUnstakePage.clickStakeButton();
        await stakeUnstakePage.stakeWithValidator(randomValidatorIndexes[1]);
        await expect(
            page.locator('data-test-id=cantStakeWithValidatorContainer')
        ).toBeVisible();

        await stakeUnstakePage.navigate();
        await stakeUnstakePage.selectNthAccount(1);
        await stakeUnstakePage.clickStakeButton();
    });
});
