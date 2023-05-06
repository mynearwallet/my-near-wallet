// @ts-check
const { test, expect } = require("../playwrightWithFixtures");
const BN = require("bn.js");
const { parseNearAmount, formatNearAmount } = require("near-api-js/lib/utils/format");

const { HomePage } = require("../register/models/Home");
const { StakeUnstakePage } = require("./models/StakeUnstake");

const { describe, beforeAll, afterAll, beforeEach } = test;

describe("Staking flow", () => {
    let testAccount;

    beforeAll(async ({ bankAccount }) => {
        testAccount = bankAccount.spawnRandomSubAccountInstance();
        await testAccount.create();
    });

    beforeEach(async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(testAccount.accountId, testAccount.seedPhrase);
    });

    afterAll(async () => {
        await testAccount.delete();
    });

    test("navigates to staking page with correct balance", async ({ page }) => {
        const stakeUnstakePage = new StakeUnstakePage(page);
        await stakeUnstakePage.navigate();

        await expect(page).toHaveURL(/\/staking$/);
        await page.locator("data-test-id=stakeMyTokensButton").click({
            trial: true
        })
        // TODO assert current balance
        await expect(page.locator("data-test-id=accountSelectStakedBalance")).toHaveText("0 NEAR")
    });
    test("correctly searches for validators", async ({ page }) => {
        const stakeUnstakePage = new StakeUnstakePage(page);
        await stakeUnstakePage.navigate();
        await stakeUnstakePage.clickStakeButton();
        const firstValidatorName = await stakeUnstakePage.getValidatorName();
        await stakeUnstakePage.searhForValidator(firstValidatorName);

        await expect(page.locator("data-test-id=stakingPageValidatorFoundLabel")).toBeVisible()
        expect(await page.locator('data-test-id=stakingPageValidatorItem').count()).toBe(1)
    });
    test("correctly selects and stakes with validator", async ({ page }) => {
        const testStakeAmount = 0.1;
        const validatorIndex = 0;

        const stakeUnstakePage = new StakeUnstakePage(page);
        await stakeUnstakePage.navigate();
        await page.locator("data-test-id=stakeMyTokensButton").click({
            trial: true
        })
        let currentlyDisplayedWalletBalance = await stakeUnstakePage.getCurrentlyDisplayedBalance();
        await stakeUnstakePage.clickStakeButton();
        const validatorName = await stakeUnstakePage.getValidatorName(validatorIndex);
        await stakeUnstakePage.stakeWithValidator(validatorIndex);

        await expect(page).toHaveURL(new RegExp(`/${validatorName}$`));

        await expect(page.locator("data-test-id=validatorNamePageTitle")).toHaveText(new RegExp(`${validatorName}`))

        await stakeUnstakePage.clickStakeWithValidator();
        await stakeUnstakePage.submitStakeWithAmount(testStakeAmount);
        await stakeUnstakePage.confirmStakeOnModal();

        await expect(page.locator("data-test-id=stakingSuccessMessage")).toBeVisible()
        await stakeUnstakePage.returnToDashboard();

        await expect(page).toHaveURL(/\/staking$/);
        await page.locator("data-test-id=stakingPageUnstakingButton").click({
            trial: true
        })

        const maxRemainingNear = currentlyDisplayedWalletBalance.sub(
            new BN(parseNearAmount(testStakeAmount.toString()) || "")
        );
        currentlyDisplayedWalletBalance = await stakeUnstakePage.getCurrentlyDisplayedBalance();
        expect(maxRemainingNear.gt(currentlyDisplayedWalletBalance)).toBe(true);
        await expect(page.locator("data-test-id=accountSelectStakedBalance")).toHaveText(new RegExp(testStakeAmount.toString()))
        await expect(page.locator("data-test-id=stakingPageTotalStakedAmount")).toHaveText(new RegExp(testStakeAmount.toString()))

        const stakedAmount = await testAccount.getAmountStakedWithValidator(validatorName);

        expect(formatNearAmount(stakedAmount.toString(), 5)).toBe(testStakeAmount.toString());
    });
});
