const { test, expect } = require("@playwright/test");

const { generateTestAccountId } = require("../utils/account");
const E2eTestAccount = require("../utils/E2eTestAccount");
const { HomePage } = require("./models/Home");
const { CreateAccountPage } = require("./models/CreateAccount");
const { SetRecoveryOptionPage } = require("./models/SetRecoveryOption");
const { SetupSeedPhrasePage } = require("./models/SetupSeedPhrase");
const { VerifySeedPhrasePage } = require("./models/VerifySeedPhrase");
const nearApiJsConnection = require("../utils/connectionSingleton");
const { WALLET_NETWORK } = require("../constants");

const { describe, afterAll } = test;

describe("Account Registration Using Seed Phrase", () => {
  const testAccountId = generateTestAccountId();
  let testAccount;

  afterAll(async () => {
    if (testAccount) {
      await testAccount.nearApiJsAccount.deleteAccount(nearApiJsConnection.config.networkId);
    }
  });

  test("navigates to set account recovery page successfuly", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigate();

    await homePage.clickCreateAccount();
    await expect(page).toMatchURL(/\/create$/);

    const createAccountPage = new CreateAccountPage(page);
    await createAccountPage.acceptTerms();
    await createAccountPage.submitAccountId(testAccountId);
    await expect(page).toMatchURL(new RegExp(`/set-recovery/${testAccountId}`));
  });
  test("is able to select other recovery methods and navigate to phrase setup", async ({
    page,
  }) => {
    const setRecoveryOptionPage = new SetRecoveryOptionPage(page);
    await setRecoveryOptionPage.navigate(
      `${testAccountId}.${nearApiJsConnection.config.networkId}`,
    );

    await setRecoveryOptionPage.clickLedgerRecoveryOption();
    await expect(page).toMatchAttribute(
      setRecoveryOptionPage.getLedgerSelector(),
      "class",
      /active/,
    );

    await setRecoveryOptionPage.clickEmailRecoveryOption();
    await expect(page).toMatchAttribute(
      setRecoveryOptionPage.getEmailSelector(),
      "class",
      /active/,
    );

    await setRecoveryOptionPage.clickPhoneRecoveryOption();
    await expect(page).toMatchAttribute(
      setRecoveryOptionPage.getPhoneSelector(),
      "class",
      /active/,
    );

    await setRecoveryOptionPage.clickSeedPhraseRecoveryOption();
    await expect(page).toMatchAttribute(
      setRecoveryOptionPage.getSeedPhraseSelector(),
      "class",
      /active/,
    );

    await setRecoveryOptionPage.clickSeedPhraseRecoveryOption();
    await setRecoveryOptionPage.submitRecoveryOption();

    await expect(page).toMatchURL(
      new RegExp(
        `/setup-seed-phrase/${testAccountId}.${nearApiJsConnection.config.networkId}/phrase`,
      ),
    );
  });
  test("is able to verify seed phrase and access wallet", async ({ page, context }) => {
    // skip test on browsers that don't support clipboard API
    await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(test.skip);
    // skip test on mainnet
    if (nearApiJsConnection.config.networkId === WALLET_NETWORK.MAINNET) {
      test.skip();
    }

    const setupSeedPhrasePage = new SetupSeedPhrasePage(page);
    await setupSeedPhrasePage.navigate(`${testAccountId}.${nearApiJsConnection.config.networkId}`);

    const copiedSeedPhrase = await setupSeedPhrasePage.copySeedPhrase();
    await expect(page).toHaveSelector('div :text-matches("Passphrase copied", "i")');

    await setupSeedPhrasePage.continueToSeedPhraseVerification();
    await expect(page).toMatchURL(
      new RegExp(
        `/setup-seed-phrase/${testAccountId}.${nearApiJsConnection.config.networkId}/verify`,
      ),
    );

    const verifySeedPhrasePage = new VerifySeedPhrasePage(page);

    const requestedVerificationWordNumber =
      await verifySeedPhrasePage.getRequestedVerificationWordNumber();
    await verifySeedPhrasePage.verifyWithWord(
      copiedSeedPhrase.split(" ")[requestedVerificationWordNumber - 1],
    );

    await expect(page).toMatchURL(/\/$/);
    await expect(page).toMatchText(
      "data-test-id=currentUser >> visible=true",
      `${testAccountId}.${nearApiJsConnection.config.networkId}`,
    );
    testAccount = await new E2eTestAccount(
      `${testAccountId}.${nearApiJsConnection.config.networkId}`,
      copiedSeedPhrase,
      { accountId: nearApiJsConnection.config.networkId },
    ).initialize();
  });
});
