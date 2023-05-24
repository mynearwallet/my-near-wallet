// @ts-check
const { test, expect } = require("../playwrightWithFixtures");
const { HomePage } = require("../register/models/Home");
const { SwapPage } = require("../swap/models/Swap");
const { SendMoneyPage } = require("../transfer-tokens/models/SendMoney");
const E2eTestAccount = require("../utils/E2eTestAccount");
const { describe, beforeAll, afterAll } = test;

describe("Rename FT symbol", () => {
  /**
   * @type {E2eTestAccount}
   */
  let account;
  beforeAll(async ({ bankAccount }) => {
    account = bankAccount.spawnRandomSubAccountInstance();
    await account.create();
  });

  afterAll(async () => {
    await account.delete();
  });

  test("Bridged USDT and Bridged USDC is renamed properly", async ({
    page,
  }) => {
    const homePage = new HomePage(page);
    await homePage.loginAndNavigate(account.accountId, account.seedPhrase);
    const swapPage = new SwapPage(page);
    await swapPage.navigate();
    await page.click("data-test-id=swapPageOutputTokenSelector");
    const tokensName = [
      {
        addr: "usdt.fakes.testnet",
        symbol: "Bridged USDT",
      },
      {
        addr: "usdtt.fakes.testnet",
        symbol: "Native USDT",
      },
      {
        addr: "usdc.fakes.testnet",
        symbol: "Bridged USDC",
      },
    ];
    for (let i = 0; i < tokensName.length; i++) {
      await expect(
        page.locator(
          `[data-test-id="token-selection-${tokensName[i].addr}"] .title`
        )
      ).toHaveText(tokensName[i].symbol);
    }
  });

  test("Show warning when Bridged token is selected in send page", async ({
    page,
  }) => {
    const homePage = new HomePage(page);
    await homePage.loginAndNavigate(account.accountId, account.seedPhrase);
    const swapPage = new SwapPage(page);
    await swapPage.navigate();
    await swapPage.fillForm({
      inId: "NEAR",
      inAmount: "0.5",
      outId: "usdt.fakes.testnet",
    });
    await swapPage.clickOnPreviewButton();
    await swapPage.confirmSwap();
    await swapPage.waitResultMessageElement();
    await swapPage.clickOnContinueAfterSwapButton();

    const sendMoneyPage = new SendMoneyPage(page);
    await expect(async () => {
      await page.reload();
      await sendMoneyPage.navigate();
      await page.waitForTimeout(5000);
      await page.click(`data-test-id=sendMoneyPageSelectTokenButton`);
      await page.click(`data-test-id=token-selection-usdt.fakes.testnet`, {
        timeout: 5 * 1000,
      });
      await sendMoneyPage.selectAsset("usdt.fakes.testnet");
      expect(page.locator("data-test-id=bridge-token-warning")).toBeVisible();
    }).toPass();
  });
});
