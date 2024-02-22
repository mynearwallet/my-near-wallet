// @ts-check
const { BN } = require('bn.js');
const { parseNearAmount, formatNearAmount } = require('near-api-js/lib/utils/format');
const { KeyPairEd25519 } = require('near-api-js/lib/utils/key_pair');

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
const LinkdropAccountManager = require('../utils/LinkdropAccountManager');

const { describe, beforeAll, afterAll, beforeEach } = test;

describe('Linkdrop flow', () => {
    let linkdropAccountManager,
        linkdropNEARAmount = '2.5',
        deleteAccountsAfter = [];

    const linkdropClaimableAmount = new BN(parseNearAmount(linkdropNEARAmount) || '').sub(
        LINKDROP_ACCESS_KEY_ALLOWANCE
    );

    beforeAll(async ({ bankAccount }) => {
        linkdropAccountManager = await new LinkdropAccountManager(bankAccount).initialize(
            '14.0'
        );
    });

    beforeEach(async ({ page }) => {
        const homePage = new HomePage(page);
        const { linkdropReceiverAccount } = linkdropAccountManager;
        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(
            linkdropReceiverAccount.accountId,
            linkdropReceiverAccount.seedPhrase
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

    test('navigates to linkdrop page with correct balance and accounts', async ({
        page,
    }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(
            process.env.BANK_ACCOUNT,
            process.env.BANK_SEED_PHRASE
        );
        const linkdropPage = new LinkDropPage(page);
        const { linkdropContractAccount, linkdropReceiverAccount } =
            linkdropAccountManager;
        const linkdropSecretKey = await linkdropAccountManager.send(linkdropNEARAmount);
        const contractAccountId = linkdropContractAccount.accountId;
        await linkdropPage.navigate(linkdropContractAccount.accountId, linkdropSecretKey);

        await expect(page.locator('.dots')).not.toBeVisible();
        await expect(page).toHaveURL(
            new RegExp(`/linkdrop/${contractAccountId}/${linkdropSecretKey}`)
        );
        await expect(page.locator('data-test-id=linkdropBalanceAmount')).toHaveText(
            new RegExp(`${formatNearAmount(linkdropClaimableAmount.toString())} NEAR`)
        );
        await expect(page.locator('data-test-id=linkdropAccountDropdown')).toHaveText(
            new RegExp(process.env.BANK_ACCOUNT || '')
        );
        await expect(page.locator('data-test-id=linkdropAccountDropdown')).toHaveText(
            new RegExp(linkdropReceiverAccount.accountId)
        );
    });

    test('adds to current account balance', async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();
        await expect(page.locator('.tokensLoading')).not.toBeVisible();
        const startBalance = new BN(
            parseNearAmount(await homePage.getNearBalanceInNear()) || ''
        );
        const linkdropPage = new LinkDropPage(page);
        const endBalance = formatNearAmount(
            startBalance.add(linkdropClaimableAmount).toString()
        );

        const { linkdropContractAccount } = linkdropAccountManager;
        const linkdropSecretKey = await linkdropAccountManager.send(linkdropNEARAmount);
        await linkdropPage.navigate(linkdropContractAccount.accountId, linkdropSecretKey);
        await expect(page.locator('.dots')).not.toBeVisible();

        await linkdropPage.claimToExistingAccount();
        await expect(page).toHaveURL(/\/$/);

        await page.reload();
        await expect(page.locator('.tokensLoading')).not.toBeVisible();
        await expect(page.locator('data-test-id=walletHomeNearBalance')).toHaveText(
            new RegExp(endBalance)
        );
    });

    test('redirects to redirectUrl after adding when redirectUrl provided', async ({
        page,
    }) => {
        const linkdropPage = new LinkDropPage(page);
        const { linkdropContractAccount, linkdropReceiverAccount } =
            linkdropAccountManager;
        const linkdropSecretKey = await linkdropAccountManager.send(linkdropNEARAmount);

        await linkdropPage.navigate(
            linkdropContractAccount.accountId,
            linkdropSecretKey,
            testDappURL
        );
        await expect(page.locator('.dots')).not.toBeVisible();

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

        await linkdropAccountManager.mockCreateAccount(page);

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

    test('redirects to redirectUrl when provided after creating a new account', async ({
        page,
        context,
    }) => {
        await context
            .grantPermissions(['clipboard-read', 'clipboard-write'])
            .catch(test.skip);
        // skip test on mainnet
        if (nearApiJsConnection.config?.networkId === WALLET_NETWORK.MAINNET) {
            test.skip();
        }

        const linkdropKeyPair = KeyPairEd25519.fromRandom();
        const linkdropContractTLAAccountId = 'testnet';
        const { linkdropSenderAccount } = linkdropAccountManager;

        await linkdropSenderAccount.nearApiJsAccount.functionCall(
            linkdropContractTLAAccountId,
            'send',
            { public_key: linkdropKeyPair.publicKey.toString() },
            null,
            new BN(parseNearAmount(linkdropNEARAmount) || '')
        );
        const linkdropPage = new LinkDropPage(page);
        await linkdropPage.navigate(
            linkdropContractTLAAccountId,
            linkdropKeyPair.secretKey,
            testDappURL
        );
        await linkdropPage.createAccountToClaim();

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
        await linkdropAccountManager.mockCreateAccount(page);
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
