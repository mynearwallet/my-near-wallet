const { test, expect } = require("../playwrightWithFixtures");
const { formatNearAmount } = require("near-api-js/lib/utils/format");

const { StakeUnstakePage } = require("./models/StakeUnstake");
const { HomePage } = require("../register/models/Home");
const { generateNUniqueRandomNumbersInRange } = require("../utils/helpers");

const { describe, afterEach, beforeEach } = test;

const wait = (seconds) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, seconds * 1000);
  });

const retryableAssert = async ({assertFN, retryCount = 5, interval = 10}) => {
  let pass = false;

  let retriedCount = 0;
  do {
    retriedCount++;
    pass = await assertFN();
    if (retriedCount === retryCount) {
      break;
    }
    if (!pass) {
      await wait(interval);
    }
  } while (!pass);
  expect(pass).toBe(true)
};

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

        await expect(page).toMatchURL(/\/staking\/unstake$/);
        await retryableAssert({
          assertFN: async () => {
            return (
              await page.locator("data-test-id=stakingPageValidatorItem").count() ===
              2
            );
          },
          retryCount: 6
        });
        await expect(page).toHaveSelectorCount("data-test-id=stakingPageValidatorItem", 2);
        await expect(page).toMatchText(/0.1 NEAR/);
        await expect(page).toMatchText(/0.2 NEAR/);
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
        await retryableAssert({
            assertFN: async () => {
                const e = await page.locator("data-test-id=accountSelectStakedBalance").textContent()
                return new RegExp(`${amountStillStaked} NEAR`).test(e)
            },
            retryCount: 6
        })
        await expect(page).toMatchText(
            "data-test-id=accountSelectStakedBalance",
            new RegExp(`${amountStillStaked} NEAR`)
        );
        await expect(page).toMatchText(
            "data-test-id=stakingPageTotalStakedAmount",
            new RegExp(`${amountStillStaked} NEAR`)
        );
        await expect(page).toMatchText(
            "data-test-id=stakingPagePendingReleaseAmount",
            new RegExp(`${submittedUnstakeAmount} NEAR`)
        );

        await stakeUnstakePage.clickStakingPageUnstakeButton();

        await expect(page).toHaveSelectorCount("data-test-id=stakingPageValidatorItem", 1);
        await expect(page).toMatchText(new RegExp(`${amountStillStaked} NEAR`));

        const stakedAmount = await testAccount.getAmountStakedWithValidator(stakedValidatorName);

        expect(formatNearAmount(stakedAmount.toString(), 5)).toBe(amountStillStaked.toString());
    });
});
