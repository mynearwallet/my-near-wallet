const { test, expect } = require('../playwrightWithFixtures');
const { HomePage } = require('../register/models/Home');

const { describe, beforeAll, afterAll } = test;

describe('Workflow test', () => {
  let homePage;
  let account;

  beforeAll(async ({ browser, bankAccount }) => {
    const context = await browser.newContext();

    page = await context.newPage();
    homePage = new HomePage(page);
    account = bankAccount.spawnRandomSubAccountInstance();

    await account.create();
  });

  afterAll(async () => {
    await homePage.close();
    await account.delete();
  });

  test('should be fine', async () => {
    await homePage.loginAndNavigate(account.accountId, account.seedPhrase);
    await page.goto('/');

    expect(0).toBe(0);
  });
});
