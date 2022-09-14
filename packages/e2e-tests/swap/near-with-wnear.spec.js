const nearApi = require("near-api-js");

const { test, expect } = require("../playwrightWithFixtures");
const { CONTRACT } = require("../constants");
const { HomePage } = require("../register/models/Home");
const { SwapPage } = require("./models/Swap");
const {
    NEAR_DEPOSIT_FEE,
    NEAR_WITHDRAW_FEE,
} = require("./constants");

const { utils: { format } } = nearApi;
const { describe, beforeAll, afterAll } = test;
const { TESTNET } = CONTRACT;

test.setTimeout(180_000)

const getResultMessageRegExp = ({ fromSymbol, fromAmount, toSymbol, toAmount }) => {
    return new RegExp(`You swapped ${fromAmount} ${fromSymbol}[ ]{1,}to ${toAmount} ${toSymbol}`, 'im');
}

describe("Swap NEAR with wrapped NEAR", () => {
    const swapAmount = 1;
    const parsedSwapAmount = format.parseNearAmount(`${swapAmount}`);
    // Limit on amount decimals because we don't know the exact transaction fees
    const maxDecimalsToCheck = 2;
    let account;
    let totalBalanceOnStart;

    beforeAll(async ({ bankAccount }) => {
        account = bankAccount.spawnRandomSubAccountInstance();

        await account.create();

        const { total } = await account.getUpdatedBalance();

        totalBalanceOnStart = Number(format.formatNearAmount(total));
    });

    afterAll(async () => {
        await account.delete();
    });

    test("should swap NEAR for wrapped NEAR", async ({ page }) => {
        const homePage = new HomePage(page);
        const swapPage = new SwapPage(page);

        await homePage.loginAndNavigate(account.accountId, account.seedPhrase);
        await swapPage.navigateAndfillForm(TESTNET.NEAR.id, TESTNET.wNEAR.id);

        expect(swapPage.page).toHaveURL(/.*\/swap$/);

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
        const spentInSwap = swapAmount + NEAR_DEPOSIT_FEE;
        const parsedTotalAfter = format.formatNearAmount(nearBalanceAfter.total);
        const parsedTotalBefore = format.formatNearAmount(nearBalanceBefore.total);

        expect(Number(parsedTotalAfter)).toBeCloseTo(
            parsedTotalBefore - spentInSwap,
            maxDecimalsToCheck
        );

        const wrappedNearBalance = await account.getTokenBalance(TESTNET.wNEAR.id);

        expect(Number(format.formatNearAmount(wrappedNearBalance))).toEqual(swapAmount);

        await homePage.close();
        await swapPage.close();
    });

    test("should swap wrapped NEAR for NEAR", async ({ page }) => {
        const homePage = new HomePage(page);
        const swapPage = new SwapPage(page);

        await homePage.loginAndNavigate(account.accountId, account.seedPhrase);
        await swapPage.navigateAndfillForm(TESTNET.wNEAR.id, TESTNET.NEAR.id);
        await swapPage.typeInputAmount(swapAmount);
        // wait while output amount is loading
        await swapPage.wait(1_000);

        const outInput = await swapPage.getOutputInput();
        const outAmount = await outInput.inputValue();

        expect(outAmount).toEqual(`${swapAmount}`);

        const nearBalanceBefore = await account.getUpdatedBalance();
        // Additional balance check after the first swap
        expect(Number(format.formatNearAmount(nearBalanceBefore.total))).toBeCloseTo(
            totalBalanceOnStart - swapAmount - NEAR_DEPOSIT_FEE,
            maxDecimalsToCheck
        );

        await swapPage.clickOnPreviewButton();
        await swapPage.confirmSwap();

        const resultElement = await swapPage.waitResultMessageElement();
        const resultMessage = await resultElement.innerText();
        // We might receive multiline string here. So at first remove line breaks from it.
        expect(resultMessage.replace(/\r?\n|\r/g, ' ')).toMatch(
            getResultMessageRegExp({
                fromSymbol: TESTNET.wNEAR.symbol,
                fromAmount: swapAmount,
                toSymbol: TESTNET.NEAR.symbol,
                toAmount: swapAmount,
            })
        );

        const nearBalanceAfter = await account.getUpdatedBalance();
        const parsedTotalAfter = format.formatNearAmount(nearBalanceAfter.total);
        const parsedTotalBefore = format.formatNearAmount(nearBalanceBefore.total);

        expect(Number(parsedTotalAfter)).toBeCloseTo(
            Number(parsedTotalBefore) + swapAmount - NEAR_WITHDRAW_FEE,
            maxDecimalsToCheck
        );

        const wrappedNearBalance = await account.getTokenBalance(TESTNET.wNEAR.id);

        expect(Number(format.formatNearAmount(wrappedNearBalance))).toEqual(0);

        await homePage.close();
        await swapPage.close();
    });
});
