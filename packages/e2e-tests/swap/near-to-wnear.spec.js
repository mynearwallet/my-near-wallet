const { test, expect } = require("../playwrightWithFixtures");
const { SwapPage } = require("./models/Swap");

const { describe, beforeAll, afterAll } = test;

describe("Swap NEAR with wNEAR", () => {
    let account;

    beforeAll(async ({ bankAccount }) => {
        account = bankAccount.spawnRandomSubAccountInstance();

        await account.create();
    });

    afterAll(async () => {
        await account.delete();
    });

    test("should navigate to swap page", async ({ page }) => {
        const firstAccountHomePage = new SwapPage(page);

        // await expect(firstAccountHomePage.page).toMatchURL(/\/swap$/);
    });
});
