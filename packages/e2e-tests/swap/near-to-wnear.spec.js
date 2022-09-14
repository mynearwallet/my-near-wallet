const BN = require("bn.js");
const nearApi = require("near-api-js");

const { test, expect } = require("../playwrightWithFixtures");
const { CONTRACT } = require("../constants");
const { HomePage } = require("../register/models/Home");
const { SwapPage } = require("./models/Swap");

const { describe, beforeAll, afterAll } = test;
const { TESTNET } = CONTRACT;

test.setTimeout(180_000)

const getResultMessageRegExp = ({ fromSymbol, fromAmount, toSymbol, toAmount }) => {
    return new RegExp(`You swapped ${fromAmount} ${fromSymbol}[ ]{1,}to ${toAmount} ${toSymbol}`, 'im');
}

describe("Swap NEAR with wrapped NEAR", () => {
    const swapAmount = 1;
    const parsedSwapAmount = nearApi.utils.format.parseNearAmount(`${swapAmount}`);
    let account;

    beforeAll(async ({ bankAccount }) => {
        account = bankAccount.spawnRandomSubAccountInstance();

        await account.create();
    });

    afterAll(async () => {
        await account.delete();
    });

    test("should swap NEAR for wrapped NEAR", async ({ page }) => {
        const homePage = new HomePage(page);

        await homePage.navigate();
        await homePage.loginWithSeedPhraseLocalStorage(account.accountId, account.seedPhrase);
        await homePage.navigate();

        const swapPage = new SwapPage(page);

        await swapPage.navigate();

        expect(swapPage.page).toHaveURL(/.*\/swap$/);

        // wait while token list is loaded
        await swapPage.wait(3_000);
        await swapPage.selectInputAsset(TESTNET.NEAR.id);
        await swapPage.selectOutputAsset(TESTNET.wNEAR.id);
        await swapPage.typeInputAmount(swapAmount);
        // wait while output amount is loading
        await swapPage.wait(1_000);

        const outInput = await swapPage.getOutputInput();
        const outAmount = await outInput.inputValue();

        expect(outAmount).toEqual(`${swapAmount}`);

        const nearBalanceBefore = await account.getUpdatedBalance();

        await swapPage.clickOnPreviewButton();
        await swapPage.confirmSwap();

        const resultElement = await swapPage.waitResultMessageElement();
        const resultMessage = await resultElement.innerText();
        // We might receive multiline string here. So at first remove line breaks from it.
        expect(resultMessage.replace(/\r?\n|\r/g, ' ')).toMatch(
            getResultMessageRegExp({
                fromSymbol: TESTNET.NEAR.symbol,
                fromAmount: swapAmount,
                toSymbol: TESTNET.wNEAR.symbol,
                toAmount: swapAmount,
            })
        );

        const nearBalanceAfter = await account.getUpdatedBalance();
        const nearBefore = new BN(nearBalanceBefore.total);
        const nearAfter = new BN(nearBalanceAfter.total);

        // expect(nearAfter.eq(nearBefore.sub(new BN(parsedSwapAmount)))).toBe(true);

        await homePage.close();
        await swapPage.close();
    });
});
