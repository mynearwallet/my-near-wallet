// @ts-check
const { BN } = require('bn.js');
const { parseNearAmount } = require('near-api-js/lib/utils/format');

const { LinkDropPage } = require('./models/LinkDrop');
const { WALLET_NETWORK, LINKDROP_ACCESS_KEY_ALLOWANCE } = require('../constants');
const { test, expect } = require('../playwrightWithFixtures');
const { CreateAccountPage } = require('../register/models/CreateAccount');
const { HomePage } = require('../register/models/Home');
const { SetRecoveryOptionPage } = require('../register/models/SetRecoveryOption');
const { SetupSeedPhrasePage } = require('../register/models/SetupSeedPhrase');
const { VerifySeedPhrasePage } = require('../register/models/VerifySeedPhrase');
const { generateTestAccountId } = require('../utils/account');
const { testDappURL } = require('../utils/config');
const nearApiJsConnection = require('../utils/connectionSingleton');
const E2eTestAccount = require('../utils/E2eTestAccount');
const { getKeyPairFromSeedPhrase } = require('../utils/helpers');
const LinkdropAccountManager = require('../utils/LinkdropAccountManager');
const { createPassword, unlockPassword } = require('../utils/password');

const { describe, beforeAll, afterAll } = test;

describe('Linkdrop flow', () => {
    let linkdropAccountManager,
        linkdropNEARAmount = '1.2';
    let deleteAccountsAfter = [];

    const linkdropClaimableAmount = new BN(parseNearAmount(linkdropNEARAmount) || '').sub(
        LINKDROP_ACCESS_KEY_ALLOWANCE
    );

    beforeAll(async ({ bankAccount }) => {
        linkdropAccountManager = await new LinkdropAccountManager(bankAccount).initialize(
            '11.0'
        );
    });

    afterAll(async () => {
        linkdropAccountManager && (await linkdropAccountManager.deleteAccounts());
        await Promise.allSettled(
            deleteAccountsAfter.map((account) =>
                account.nearApiJsAccount.deleteAccount(
                    nearApiJsConnection.config?.networkId
                )
            )
        );
    });

    test('logs in and claims linkdrop', async ({ page }) => {
        const linkdropPage = new LinkDropPage(page);
        const linkdropSecretKey = await linkdropAccountManager.send(linkdropNEARAmount);
        const { linkdropContractAccount, linkdropReceiverAccount } =
            linkdropAccountManager;

        await linkdropPage.navigate(linkdropContractAccount.accountId, linkdropSecretKey);
        await expect(page.locator('.dots')).not.toBeVisible();
        await linkdropPage.loginAndClaim();

        await createPassword(page);
        await page.click('data-test-id=recoverAccountWithPassphraseButton');
        await page.fill(
            'data-test-id=seedPhraseRecoveryInput',
            linkdropReceiverAccount.seedPhrase
        );
        await page.click('data-test-id=seedPhraseRecoverySubmitButton');
        await linkdropPage.claimToExistingAccount();

        await expect(page).toHaveURL(/\/$/);
        await page.reload();

        await unlockPassword(page);
        await expect(page.locator('.tokensLoading')).not.toBeVisible();
        const nearBalance = await new HomePage(page).getNearBalanceInNear();
        expect(
            new BN(parseNearAmount(nearBalance) || '').gte(linkdropClaimableAmount)
        ).toBe(true);
    });

    test('logs in via private key and claims linkdrop', async ({ page }) => {
        const linkdropPage = new LinkDropPage(page);
        const linkdropSecretKey = await linkdropAccountManager.send(linkdropNEARAmount);
        const { linkdropContractAccount, linkdropReceiverAccount } =
            linkdropAccountManager;

        await linkdropPage.navigate(linkdropContractAccount.accountId, linkdropSecretKey);
        await expect(page.locator('.dots')).not.toBeVisible();
        await linkdropPage.loginAndClaim();

        await createPassword(page);
        const keyPair = getKeyPairFromSeedPhrase(linkdropReceiverAccount.seedPhrase);
        await page.click('data-test-id=recoverAccountWithPrivateKey');
        await page.fill('data-test-id=privateKeyRecoveryInput', keyPair.toString());
        await page.click('data-test-id=privateKeyRecoverySubmitButton');
        await linkdropPage.claimToExistingAccount();

        await expect(page).toHaveURL(/\/$/);
        await page.reload();

        await unlockPassword(page);
        await expect(page.locator('.tokensLoading')).not.toBeVisible();
        const nearBalance = await new HomePage(page).getNearBalanceInNear();
        expect(
            new BN(parseNearAmount(nearBalance) || '').gte(linkdropClaimableAmount)
        ).toBe(true);
    });
    test('redirects to redirectUrl after claiming when redirectUrl provided', async ({
        page,
    }) => {
        const linkdropPage = new LinkDropPage(page);
        const linkdropSecretKey = await linkdropAccountManager.send(linkdropNEARAmount);
        const { linkdropContractAccount, linkdropReceiverAccount } =
            linkdropAccountManager;

        await linkdropPage.navigate(
            linkdropContractAccount.accountId,
            linkdropSecretKey,
            testDappURL
        );
        await expect(page.locator('.dots')).not.toBeVisible();
        await linkdropPage.loginAndClaim();

        await createPassword(page);
        await page.click('data-test-id=recoverAccountWithPassphraseButton');
        await page.fill(
            'data-test-id=seedPhraseRecoveryInput',
            linkdropReceiverAccount.seedPhrase
        );
        await page.click('data-test-id=seedPhraseRecoverySubmitButton');

        await linkdropPage.claimToExistingAccount();

        await expect(page).toHaveURL(new RegExp(testDappURL));
        await expect(page).toHaveURL(
            new RegExp(`accountId=${linkdropReceiverAccount.accountId}`)
        );
    });
    test('claims linkdrop to new account', async ({ page, context }) => {
        await context
            .grantPermissions(['clipboard-read', 'clipboard-write'])
            .catch(test.skip);
        // skip test on mainnet
        if (nearApiJsConnection.config?.networkId === WALLET_NETWORK.MAINNET) {
            test.skip();
        }

        const linkdropSecretKey = await linkdropAccountManager.sendToNetworkTLA(
            linkdropNEARAmount
        );
        const linkdropPage = new LinkDropPage(page);
        await linkdropPage.navigate(
            nearApiJsConnection.config?.networkId,
            linkdropSecretKey
        );
        await linkdropPage.createAccountToClaim();

        await createPassword(page);
        const createAccountPage = new CreateAccountPage(page);
        await createAccountPage.acceptTerms();
        const testAccountId = generateTestAccountId();
        await createAccountPage.submitAccountId(testAccountId);

        const setRecoveryOptionPage = new SetRecoveryOptionPage(page);
        await setRecoveryOptionPage.clickSeedPhraseRecoveryOption();
        await setRecoveryOptionPage.submitRecoveryOption();

        const setupSeedPhrasePage = new SetupSeedPhrasePage(page);
        const copiedSeedPhrase = await setupSeedPhrasePage.copySeedPhrase();
        await setupSeedPhrasePage.continueToSeedPhraseVerification();

        const verifySeedPhrasePage = new VerifySeedPhrasePage(page);
        const requestedVerificationWordNumber =
            await verifySeedPhrasePage.getRequestedVerificationWordNumber();
        await verifySeedPhrasePage.verifyWithWord(
            copiedSeedPhrase.split(' ')[requestedVerificationWordNumber - 1]
        );
        const testAccount = await new E2eTestAccount(
            `${testAccountId}.${nearApiJsConnection.config?.networkId}`,
            copiedSeedPhrase,
            {
                accountId: nearApiJsConnection.config?.networkId,
            }
        ).initialize();
        deleteAccountsAfter.push(testAccount);

        await expect(page).toHaveURL(/\/$/);
        await expect(page.locator('data-test-id=linkDropSuccessModal')).toBeVisible();
    });
    test('redirects to redirectUrl after account creation when redirectUrl provided', async ({
        page,
        context,
    }) => {
        test.setTimeout(60_000);
        await context
            .grantPermissions(['clipboard-read', 'clipboard-write'])
            .catch(test.skip);
        // skip test on mainnet
        if (nearApiJsConnection.config?.networkId === WALLET_NETWORK.MAINNET) {
            test.skip();
        }

        const linkdropSecretKey = await linkdropAccountManager.sendToNetworkTLA(
            linkdropNEARAmount
        );
        const linkdropPage = new LinkDropPage(page);
        await linkdropPage.navigate(
            nearApiJsConnection.config?.networkId,
            linkdropSecretKey,
            testDappURL
        );
        await linkdropPage.createAccountToClaim();

        await createPassword(page);
        const createAccountPage = new CreateAccountPage(page);
        await createAccountPage.acceptTerms();
        const testAccountId = generateTestAccountId();
        await createAccountPage.submitAccountId(testAccountId);

        const setRecoveryOptionPage = new SetRecoveryOptionPage(page);
        await setRecoveryOptionPage.clickSeedPhraseRecoveryOption();
        await setRecoveryOptionPage.submitRecoveryOption();

        const setupSeedPhrasePage = new SetupSeedPhrasePage(page);
        const copiedSeedPhrase = await setupSeedPhrasePage.copySeedPhrase();
        await setupSeedPhrasePage.continueToSeedPhraseVerification();

        const verifySeedPhrasePage = new VerifySeedPhrasePage(page);
        const requestedVerificationWordNumber =
            await verifySeedPhrasePage.getRequestedVerificationWordNumber();
        await verifySeedPhrasePage.verifyWithWord(
            copiedSeedPhrase.split(' ')[requestedVerificationWordNumber - 1]
        );
        const testAccount = await new E2eTestAccount(
            `${testAccountId}.${nearApiJsConnection.config?.networkId}`,
            copiedSeedPhrase,
            {
                accountId: nearApiJsConnection.config?.networkId,
            }
        ).initialize();
        deleteAccountsAfter.push(testAccount);

        await expect(page).toHaveURL(new RegExp(testDappURL));
        await expect(page).toHaveURL(new RegExp(`accountId=${testAccountId}`));
    });
});
