const nearApi = require("near-api-js");

const { test, expect } = require("../playwrightWithFixtures");
const { CONTRACT } = require("../constants");
const { formatAmount } = require("../utils/amount");
const { HomePage } = require("../register/models/Home");
const { SwapPage } = require("./models/Swap");
const { getResultMessageRegExp, removeStringBrakes } = require("./utils");
const {
    NEAR_DEPOSIT_FEE,
    SWAP_FEE,
    NEP141_TOKENS,
    TRANSACTIONS_LOADING_DELAY,
} = require("./constants");

const { utils: { format } } = nearApi;
const { describe, beforeAll, afterAll } = test;
const { TESTNET } = CONTRACT;

test.setTimeout(140_000)

describe("Swap wrapped NEAR with NEP141", () => {
    const swapAmount = 0.5;
    // Limit on amount decimals because we don't know the exact transaction fees
    const maxDecimalsToCheck = 2;
    let account;
    let totalBalanceOnStart;
    let page;
    let homePage;
    let swapPage;

    beforeAll(async ({ browser, bankAccount }) => {
        const context = await browser.newContext();

        page = await context.newPage();
        homePage = new HomePage(page);
        swapPage = new SwapPage(page);

        account = bankAccount.spawnRandomSubAccountInstance();

        await account.create();

        const { total } = await account.getUpdatedBalance();

        totalBalanceOnStart = Number(format.formatNearAmount(total));
    });

    afterAll(async () => {
        await homePage.close();
        await swapPage.close();
        await account.delete();
    });

    const token = NEP141_TOKENS.TESTNET[0];
    let tokenBalanceAfterSwap;

    test(`should swap wrapped NEAR for ${token.name}`, async () => {
        await homePage.loginAndNavigate(account.accountId, account.seedPhrase);
        await swapPage.navigate();

        expect(swapPage.page).toHaveURL(/.*\/swap$/);

        // At first we swap NEAR to wrapped NEAR

        await swapPage.fillForm({
            inId: TESTNET.NEAR.id,
            inAmount: swapAmount,
            outId: TESTNET.wNEAR.id,
        });

        let outInput = await swapPage.getOutputInput();
        const wrappedNearAmount = await outInput.inputValue();
        let nearBalanceBefore = await account.getUpdatedBalance();
        let parsedTotalBefore = format.formatNearAmount(nearBalanceBefore.total);

        await swapPage.clickOnPreviewButton();
        await swapPage.confirmSwap();
        await swapPage.clickOnContinueAfterSwapButton();

        let nearBalanceAfter = await account.getUpdatedBalance();
        let parsedTotalAfter = format.formatNearAmount(nearBalanceAfter.total);

        expect(Number(parsedTotalAfter)).toBeCloseTo(
            parsedTotalBefore - (swapAmount + NEAR_DEPOSIT_FEE),
            maxDecimalsToCheck
        );

        // Start swap wrapped NEAR to NEP141 token

        await swapPage.fillForm({
            inId: TESTNET.wNEAR.id,
            inAmount: swapAmount,
            outId: token.id,
        });

        outInput = await swapPage.getOutputInput();
        outAmount = await outInput.inputValue();

        expect(Number(outAmount) > 0).toBeTruthy();

        // Fetch NEAR and wNEAR before the swap
        nearBalanceBefore = await account.getUpdatedBalance();
        parsedTotalBefore = format.formatNearAmount(nearBalanceBefore.total);
        const wNearBalanceBefore = await account.getTokenBalance(TESTNET.wNEAR.id);
        const wNearParsedBalanceBefore = Number(formatAmount(wNearBalanceBefore, TESTNET.wNEAR.decimals));

        await swapPage.clickOnPreviewButton();
        await swapPage.confirmSwap();
        await swapPage.wait(TRANSACTIONS_LOADING_DELAY);

        const resultElement = await swapPage.waitResultMessageElement();
        const resultMessage = await resultElement.innerText();

        expect(removeStringBrakes(resultMessage)).toMatch(
            getResultMessageRegExp({
                fromSymbol: TESTNET.wNEAR.symbol,
                fromAmount: swapAmount,
                toSymbol: token.symbol,
                toAmount: outAmount,
                acceptableOutputDifference: 2,
            })
        );

        // Fetch NEAR and wNEAR after the swap
        nearBalanceAfter = await account.getUpdatedBalance();
        parsedTotalAfter = format.formatNearAmount(nearBalanceAfter.total);
        const wNearBalanceAfter = await account.getTokenBalance(TESTNET.wNEAR.id);
        const wNearParsedBalanceAfter = Number(formatAmount(wNearBalanceAfter, TESTNET.wNEAR.decimals));

        expect(Number(parsedTotalAfter)).toBeCloseTo(
            parsedTotalBefore - SWAP_FEE,
            maxDecimalsToCheck
        );
        expect(Number(wNearParsedBalanceAfter)).toBeCloseTo(
            wNearParsedBalanceBefore - swapAmount,
            maxDecimalsToCheck
        );

        // Fetch and check NEP141 balance
        const tokenBalance = await account.getTokenBalance(token.id);

        tokenBalanceAfterSwap = Number(formatAmount(tokenBalance, token.decimals));

        expect(tokenBalanceAfterSwap).toEqual(Number(outAmount));

        await swapPage.clickOnContinueAfterSwapButton();
    });
});
