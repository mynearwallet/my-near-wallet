// @ts-check
const { BN } = require('bn.js');
const { formatNearAmount, parseNearAmount } = require('near-api-js/lib/utils/format');

const { ProfilePage } = require('./models/ProfilePage');
const {
    LOCKUP_CONFIGS: { HALF_VESTED_CONFIG },
} = require('../constants');
const { test, expect } = require('../playwrightWithFixtures');
const { HomePage } = require('../register/models/Home');
const { bnSaturatingSub, bnIsWithinUncertainty } = require('../utils/helpers');

const { describe, beforeAll, afterAll } = test;

describe('half vested lockup', () => {
    let v2LockupTestAccount,
        latestLockupTestAccount,
        v2LockupContractAccount,
        latestLockupContractAccount;

    beforeAll(async ({ bankAccount }) => {
        v2LockupTestAccount = await bankAccount
            .spawnRandomSubAccountInstance()
            .create({ amount: '37.0' });
        v2LockupContractAccount =
            await v2LockupTestAccount.createTestLockupSubAccountInstance({
                ...HALF_VESTED_CONFIG,
                v2Wasm: true,
                amount: '36.0',
            });
        latestLockupTestAccount = await bankAccount
            .spawnRandomSubAccountInstance()
            .create({ amount: '6.0' });
        latestLockupContractAccount =
            await latestLockupTestAccount.createTestLockupSubAccountInstance({
                ...HALF_VESTED_CONFIG,
                amount: '5.0',
            });
    });

    afterAll(async () => {
        await Promise.allSettled([
            v2LockupContractAccount &&
                v2LockupContractAccount.delete().then(v2LockupTestAccount.delete),
            latestLockupContractAccount &&
                latestLockupContractAccount.delete().then(latestLockupTestAccount.delete),
        ]);
    });

    test('latest lockup contract displays the zero as locked, correct unlocked, correct available to transfer and other info correctly', async ({
        page,
        bankAccount,
    }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(
            latestLockupTestAccount.accountId,
            latestLockupTestAccount.seedPhrase
        );
        const storageCost = new BN(parseNearAmount('3.5') || '');
        const profilePage = new ProfilePage(page);
        await profilePage.navigate();
        await expect(async () => {
            await page.reload();
            await expect(
                page.locator('data-test-id=lockupTransferToWalletButton')
            ).toBeVisible({ timeout: 5 * 1000 });
        }).toPass({ timeout: 60 * 1000 });

        const { total } = await latestLockupContractAccount.getUpdatedBalance();
        let lockupTotalBalance = total;
        let lockupLockedAmount = new BN(
            await bankAccount.nearApiJsAccount?.viewFunction(
                latestLockupContractAccount.accountId,
                'get_locked_amount'
            )
        );
        let lockupUnlockedAmount = new BN(lockupTotalBalance).sub(lockupLockedAmount);
        await expect(page.locator('data-test-id=lockupAccount.total')).toHaveText(
            new RegExp(formatNearAmount(lockupTotalBalance, 5))
        );
        const displayedLockedAmount =
            parseNearAmount(await profilePage.getLockupAccountLocked()) || '';
        const displayedUnlockedAmount =
            parseNearAmount(await profilePage.getLockupAccountUnlocked()) || '';
        expect(
            bnIsWithinUncertainty(
                new BN(parseNearAmount('0.01') || ''),
                new BN(displayedLockedAmount),
                lockupLockedAmount
            )
        ).toBe(true);
        expect(
            bnIsWithinUncertainty(
                new BN(parseNearAmount('0.01') || ''),
                new BN(displayedUnlockedAmount),
                lockupUnlockedAmount
            )
        ).toBe(true);

        const lockupAvailableToTransfer = bnSaturatingSub(
            new BN(lockupTotalBalance),
            BN.max(storageCost, lockupLockedAmount)
        );

        await expect(
            page.locator('data-test-id=lockupAccount.availableToTransfer')
        ).toHaveText(
            new RegExp(`^${formatNearAmount(lockupAvailableToTransfer.toString(), 5)}`)
        );
        await expect(
            page.locator('data-test-id=lockupAccount.reservedForStorage')
        ).toHaveText(/3.5 NEAR/);
        await expect(page.locator('data-test-id=lockupAccount.accountId')).toHaveText(
            new RegExp(`${latestLockupContractAccount.accountId}`)
        );
    });

    test('latest lockup contract withdraws and updates balances and cleans up correctly', async ({
        page,
        bankAccount,
    }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(
            latestLockupTestAccount.accountId,
            latestLockupTestAccount.seedPhrase
        );

        const profilePage = new ProfilePage(page);
        await profilePage.navigate();

        const initialBalanceDisplay = await profilePage.getOwnerAccountTotalBalance();
        const initialOwnerAccountDisplayedBalance = new BN(
            parseNearAmount(initialBalanceDisplay) || ''
        );
        const { total: initialOwnerAccountBalance } =
            await latestLockupTestAccount.getUpdatedBalance();

        await expect(async () => {
            await page.reload();
            await expect(
                page.locator('data-test-id=lockupTransferToWalletButton')
            ).toBeVisible({ timeout: 5 * 1000 });
        }).toPass({ timeout: 60 * 1000 });

        const initialLockupAvailableToTransfer = new BN(
            await bankAccount.nearApiJsAccount?.viewFunction(
                latestLockupContractAccount.accountId,
                'get_liquid_owners_balance'
            )
        );

        await profilePage.transferToWallet();

        await expect(
            page.locator('data-test-id=lockupTransferToWalletButton')
        ).not.toBeVisible();
        const { total: ownerAccountBalance } =
            await latestLockupTestAccount.getUpdatedBalance();
        const ownersBalanceChange = new BN(ownerAccountBalance).sub(
            new BN(initialOwnerAccountBalance)
        );
        const lockupAvailableToTransfer = new BN(
            await bankAccount.nearApiJsAccount?.viewFunction(
                latestLockupContractAccount.accountId,
                'get_liquid_owners_balance'
            )
        );
        const uncertaintyForGas = new BN(parseNearAmount('0.1') || '');

        await expect(async () => {
            await page.reload();
            const balanceDisplay = await profilePage.getOwnerAccountTotalBalance();
            const ownerAccountDisplayedBalance = new BN(
                parseNearAmount(balanceDisplay) || ''
            );
            const displayedOwnersBalanceChange = ownerAccountDisplayedBalance.sub(
                initialOwnerAccountDisplayedBalance
            );
            expect(
                bnIsWithinUncertainty(
                    uncertaintyForGas,
                    initialLockupAvailableToTransfer,
                    displayedOwnersBalanceChange
                )
            ).toBe(true);
        }).toPass({ timeout: 60 * 1000 });

        expect(
            bnIsWithinUncertainty(
                uncertaintyForGas,
                initialLockupAvailableToTransfer,
                ownersBalanceChange
            )
        ).toBe(true);
        expect(lockupAvailableToTransfer.lt(new BN(parseNearAmount('0.01') || ''))).toBe(
            true
        );
    });
    test('v2 lockup contract displays zero as locked, correct unlocked, correct available to transfer and other info correctly', async ({
        page,
        bankAccount,
    }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(
            v2LockupTestAccount.accountId,
            v2LockupTestAccount.seedPhrase
        );

        const profilePage = new ProfilePage(page);
        await profilePage.navigate();
        await expect(async () => {
            await page.reload();
            await expect(
                page.locator('data-test-id=lockupTransferToWalletButton')
            ).toBeVisible({ timeout: 5 * 1000 });
        }).toPass({ timeout: 60 * 1000 });
        const { total: lockupTotalBalance } =
            await v2LockupContractAccount.getUpdatedBalance();
        const lockupLockedAmount = new BN(
            await bankAccount.nearApiJsAccount?.viewFunction(
                v2LockupContractAccount.accountId,
                'get_locked_amount'
            )
        );
        const lockupUnlockedAmount = new BN(lockupTotalBalance).sub(lockupLockedAmount);
        const storageCost = new BN(parseNearAmount('35') || '');
        const lockupAvailableToTransfer = bnSaturatingSub(
            new BN(lockupTotalBalance),
            BN.max(storageCost, lockupLockedAmount)
        );
        await expect(page.locator('data-test-id=lockupAccount.total')).toHaveText(
            new RegExp(formatNearAmount(lockupTotalBalance, 5))
        );

        const displayedLockedAmount =
            parseNearAmount(await profilePage.getLockupAccountLocked()) || '';
        const displayedUnlockedAmount =
            parseNearAmount(await profilePage.getLockupAccountUnlocked()) || '';

        expect(
            bnIsWithinUncertainty(
                new BN(parseNearAmount('0.01') || ''),
                new BN(displayedLockedAmount),
                lockupLockedAmount
            )
        ).toBe(true);
        expect(
            bnIsWithinUncertainty(
                new BN(parseNearAmount('0.01') || ''),
                new BN(displayedUnlockedAmount),
                lockupUnlockedAmount
            )
        ).toBe(true);
        await expect(
            page.locator('data-test-id=lockupAccount.availableToTransfer')
        ).toHaveText(
            new RegExp(`^${formatNearAmount(lockupAvailableToTransfer.toString(), 5)}`)
        );
        await expect(
            page.locator('data-test-id=lockupAccount.reservedForStorage')
        ).toHaveText(/35 NEAR/);
        await expect(page.locator('data-test-id=lockupAccount.accountId')).toHaveText(
            new RegExp(`${v2LockupContractAccount.accountId}`)
        );
    });
    test('v2 lockup contract withdraws and updates balances and cleans up correctly', async ({
        page,
        bankAccount,
    }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(
            v2LockupTestAccount.accountId,
            v2LockupTestAccount.seedPhrase
        );

        const profilePage = new ProfilePage(page);
        await profilePage.navigate();

        const initialBalanceDisplay = await profilePage.getOwnerAccountTotalBalance();
        const initialOwnerAccountDisplayedBalance = new BN(
            parseNearAmount(initialBalanceDisplay) || ''
        );
        const { total: initialOwnerAccountBalance } =
            await v2LockupTestAccount.getUpdatedBalance();

        await expect(async () => {
            await page.reload();
            await expect(
                page.locator('data-test-id=lockupTransferToWalletButton')
            ).toBeVisible({ timeout: 5 * 1000 });
        }).toPass({ timeout: 60 * 1000 });

        const initialLockupAvailableToTransfer = new BN(
            await bankAccount.nearApiJsAccount?.viewFunction(
                v2LockupContractAccount.accountId,
                'get_liquid_owners_balance'
            )
        );

        await profilePage.transferToWallet();

        await expect(
            page.locator('data-test-id=lockupTransferToWalletButton')
        ).not.toBeVisible();
        const { total: ownerAccountBalance } =
            await v2LockupTestAccount.getUpdatedBalance();
        const ownersBalanceChange = new BN(ownerAccountBalance).sub(
            new BN(initialOwnerAccountBalance)
        );
        const lockupAvailableToTransfer = new BN(
            await bankAccount.nearApiJsAccount?.viewFunction(
                v2LockupContractAccount.accountId,
                'get_liquid_owners_balance'
            )
        );
        const uncertaintyForGas = new BN(parseNearAmount('0.1') || '');

        await expect(async () => {
            await page.reload();
            const balanceDisplay = await profilePage.getOwnerAccountTotalBalance();
            const ownerAccountDisplayedBalance = new BN(
                parseNearAmount(balanceDisplay) || ''
            );
            const displayedOwnersBalanceChange = ownerAccountDisplayedBalance.sub(
                initialOwnerAccountDisplayedBalance
            );
            expect(
                bnIsWithinUncertainty(
                    uncertaintyForGas,
                    initialLockupAvailableToTransfer,
                    displayedOwnersBalanceChange
                )
            ).toBe(true);
        }).toPass({ timeout: 60 * 1000, intervals: [1000, 2000, 5000] });

        expect(
            bnIsWithinUncertainty(
                uncertaintyForGas,
                initialLockupAvailableToTransfer,
                ownersBalanceChange
            )
        ).toBe(true);
        expect(lockupAvailableToTransfer.lt(new BN(parseNearAmount('0.01') || ''))).toBe(
            true
        );
    });
});
