// @ts-check
const { test, expect } = require("../playwrightWithFixtures");
const { formatNearAmount } = require("near-api-js/lib/utils/format");

const { StakeUnstakePage } = require("./models/StakeUnstake");
const { HomePage } = require("../register/models/Home");
const { generateNUniqueRandomNumbersInRange } = require("../utils/helpers");

const { describe, afterEach, beforeEach } = test;

describe("Unstaking flow", () => {
    let testAccount;

    beforeEach(async ({ page, bankAccount }) => {
        testAccount = bankAccount.spawnRandomSubAccountInstance();
        await testAccount.create();
        const homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(testAccount.accountId, testAccount.seedPhrase);
    });

    afterEach(async () => {
        await testAccount.delete();
    });

    test("displays the correct number of validators with the correct amounts", async ({ page }) => {
        const stakeUnstakePage = new StakeUnstakePage(page);
        await stakeUnstakePage.navigate();
        await stakeUnstakePage.clickStakeButton();
        const validatorLastIndex = (await stakeUnstakePage.getNumberOfSelectableValidators()) - 1;
        const randomValidatorIndexes = generateNUniqueRandomNumbersInRange({ from: 0, to: validatorLastIndex }, 2);
        await stakeUnstakePage.runStakingFlowWithAmount(0.1, randomValidatorIndexes[0]);
        // account will be deleted if we don't wait for this
        // not sure why, need to be figured out...
        await page.locator("data-test-id=stakingPageUnstakingButton").click({
            trial: true
        })
        await stakeUnstakePage.clickStakeButton();
        await stakeUnstakePage.runStakingFlowWithAmount(0.2, randomValidatorIndexes[1]);
        await stakeUnstakePage.clickStakingPageUnstakeButton();

        await expect(page).toHaveURL(/\/staking\/unstake$/);
        await expect(async () => {
          expect(await page.locator("data-test-id=stakingPageValidatorItem").count()).toBe(2)
        }).toPass()
        expect(page.getByText(/0.1 NEAR/)).toBeTruthy()
        expect(page.getByText(/0.2 NEAR/)).toBeTruthy()
    });

    test("successfully unstakes and displays the right data after", async ({ page }) => {
        const stakeUnstakePage = new StakeUnstakePage(page);
        await stakeUnstakePage.navigate();
        await stakeUnstakePage.clickStakeButton();
        const validatorLastIndex = (await stakeUnstakePage.getNumberOfSelectableValidators()) - 1;
        const randomValidatorIndexes = generateNUniqueRandomNumbersInRange({ from: 0, to: validatorLastIndex }, 2);
        await stakeUnstakePage.runStakingFlowWithAmount(0.1, randomValidatorIndexes[0]);
        // account will be deleted if we don't wait for this
        // not sure why, need to be figured out...
        await page.locator("data-test-id=stakingPageUnstakingButton").click({
            trial: true
        })
        await stakeUnstakePage.clickStakeButton();
        await stakeUnstakePage.runStakingFlowWithAmount(0.2, randomValidatorIndexes[1]);
        await stakeUnstakePage.clickStakingPageUnstakeButton();
        const stakedValidatorName = await stakeUnstakePage.getValidatorName(1)
        await stakeUnstakePage.clickValidatorItem(0);
        const submittedUnstakeAmount = await stakeUnstakePage.submitStakeWithMaxAmount();
        const amountStillStaked = (0.3 - submittedUnstakeAmount).toFixed(1);
        await stakeUnstakePage.confirmStakeOnModal();
        await stakeUnstakePage.returnToDashboard();

        // wait for stake details to be updated.
        await expect(async () => {
          await expect(page.locator("data-test-id=accountSelectStakedBalance")).toHaveText(new RegExp(`${amountStillStaked} NEAR`))
        }).toPass()
        await expect(page.locator("data-test-id=stakingPageTotalStakedAmount")).toHaveText(new RegExp(`${amountStillStaked} NEAR`))
        await expect(page.locator("data-test-id=stakingPagePendingReleaseAmount")).toHaveText(new RegExp(`${submittedUnstakeAmount} NEAR`))

        await stakeUnstakePage.clickStakingPageUnstakeButton();

        
        expect(await page.locator("data-test-id=stakingPageValidatorItem").count()).toBe(1)
        expect(page.getByText(new RegExp(`${amountStillStaked} NEAR`))).toBeTruthy()

        const stakedAmount = await testAccount.getAmountStakedWithValidator(stakedValidatorName);

        expect(formatNearAmount(stakedAmount.toString(), 5)).toBe(amountStillStaked.toString());
    });
});
