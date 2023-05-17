// @ts-check
const { BN } = require("bn.js");
const { formatNearAmount, parseNearAmount } = require("near-api-js/lib/utils/format");

const { test, expect } = require("../playwrightWithFixtures");
const { HomePage } = require("../register/models/Home");
const { ProfilePage } = require("./models/ProfilePage");
const {
    LOCKUP_CONFIGS: { FULLY_UNVESTED_CONFIG },
} = require("../constants");

const { describe, beforeAll, afterAll } = test;

describe("Fully unvested lockup", () => {
    let v2LockupTestAccount, latestLockupTestAccount, v2LockupContractAccount, latestLockupContractAccount;
    const lockupAmount = '5.0';

    beforeAll(async ({ bankAccount }) => {
        v2LockupTestAccount = await bankAccount.spawnRandomSubAccountInstance().create({ amount: "6.0" });
        v2LockupContractAccount = await v2LockupTestAccount.createTestLockupSubAccountInstance({
            ...FULLY_UNVESTED_CONFIG,
            v2Wasm: true,
            amount: lockupAmount,
        });
        latestLockupTestAccount = await bankAccount.spawnRandomSubAccountInstance().create({ amount: "6.0" });
        latestLockupContractAccount = await latestLockupTestAccount.createTestLockupSubAccountInstance({...FULLY_UNVESTED_CONFIG, amount: lockupAmount});
    });

    afterAll(async () => {
        await Promise.allSettled([
            v2LockupContractAccount && v2LockupContractAccount.delete().then(v2LockupTestAccount.delete),
            latestLockupContractAccount && latestLockupContractAccount.delete().then(latestLockupTestAccount.delete),
        ]);
    });

    test("latest lockup contract displays the whole amount as locked, correct unlocked, correct available to transfer and other info correctly", async ({
        page,
    }) => {
        const { total: lockupTotalBalance } = await latestLockupContractAccount.getUpdatedBalance();
        const lockupUnlockedAmount = new BN(lockupTotalBalance)
            .sub(new BN(parseNearAmount(lockupAmount) || ""))
            .toString();
        const lockupAvailableToTransfer = await latestLockupContractAccount.nearApiJsAccount.viewFunction(
            latestLockupContractAccount.accountId,
            "get_liquid_owners_balance"
        );
        const homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(latestLockupTestAccount.accountId, latestLockupTestAccount.seedPhrase);
        const profilePage = new ProfilePage(page);
        await profilePage.navigate();
        await expect(page.locator('data-test-id=lockupAccount.total')).toHaveText(new RegExp(formatNearAmount(lockupTotalBalance, 5)));
        await expect(page.locator('data-test-id=lockupAccount.locked')).toHaveText(/5 NEAR/);
        await expect(page.locator('data-test-id=lockupAccount.unlocked')).toHaveText(new RegExp(`${formatNearAmount(lockupUnlockedAmount, 5)} NEAR`));
        await expect(page.locator('data-test-id=lockupAccount.availableToTransfer')).toHaveText(new RegExp(`${formatNearAmount(lockupAvailableToTransfer, 5)} NEAR`));
        await expect(page.locator('data-test-id=lockupAccount.reservedForStorage')).toHaveText(/3.5 NEAR/);
        await expect(page.locator('data-test-id=lockupAccount.accountId')).toHaveText(new RegExp(`${latestLockupContractAccount.accountId}`));

        await expect(page.locator('data-test-id=lockupTransferToWalletButton')).not.toBeVisible()
    });
    test("v2 lockup contract displays the whole amount as locked, correct unlocked, correct available to transfer and other info correctly", async ({
        page,
    }) => {
        const { total: lockupTotalBalance } = await v2LockupContractAccount.getUpdatedBalance();
        const lockupUnlockedAmount = new BN(lockupTotalBalance)
            .sub(new BN(parseNearAmount(lockupAmount) || ""))
            .toString();
        const lockupAvailableToTransfer = await v2LockupContractAccount.nearApiJsAccount.viewFunction(
            v2LockupContractAccount.accountId,
            "get_liquid_owners_balance"
        );
        const homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(v2LockupTestAccount.accountId, v2LockupTestAccount.seedPhrase);
        const profilePage = new ProfilePage(page);
        await profilePage.navigate();

        await expect(page.locator('data-test-id=lockupAccount.total')).toHaveText(new RegExp(formatNearAmount(lockupTotalBalance, 5)));
        await expect(page.locator('data-test-id=lockupAccount.locked')).toHaveText(/5 NEAR/);
        await expect(page.locator('data-test-id=lockupAccount.unlocked')).toHaveText(new RegExp(`${formatNearAmount(lockupUnlockedAmount, 5)} NEAR`));
        await expect(page.locator('data-test-id=lockupAccount.availableToTransfer')).toHaveText(new RegExp(`${formatNearAmount(lockupAvailableToTransfer, 5)} NEAR`));
        await expect(page.locator('data-test-id=lockupAccount.reservedForStorage')).toHaveText(/35 NEAR/);
        await expect(page.locator('data-test-id=lockupAccount.accountId')).toHaveText(new RegExp(`${v2LockupContractAccount.accountId}`));

        await expect(page.locator('data-test-id=lockupTransferToWalletButton')).not.toBeVisible()
    });
});
