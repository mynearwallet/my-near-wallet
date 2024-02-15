// @ts-check
const nearApi = require('near-api-js');

const { SWAP_FEE, NEP141_TOKENS } = require('./constants');
const { SwapPage } = require('./models/Swap');
const {
    getResultMessageRegExp,
    removeStringBrakes,
    withoutLastChars,
} = require('./utils');
const { CONTRACT } = require('../constants');
const { test, expect } = require('../playwrightWithFixtures');
const { HomePage } = require('../register/models/Home');
const { formatAmount } = require('../utils/amount');

const {
    utils: { format },
} = nearApi;
const { describe, beforeAll, afterAll } = test;
const { TESTNET } = CONTRACT;

test.setTimeout(140_000);

describe('Swap NEAR with NEP141', () => {
    const swapAmount = 0.5;
    const waitAfterSwapWhileBalancesLoading = 20_000;
    // Limit on amount decimals because we don't know the exact transaction fees
    const maxDecimalsToCheck = 2;
    let account;
    let totalBalanceOnStart;
    let page;
    let homePage;
    let swapPage;

    // @ts-ignore
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
        await swapPage.close();
        await account.delete();
    });

    const token = NEP141_TOKENS.TESTNET[0];
    let tokenBalanceAfterSwap;

    test(`should swap NEAR for ${token.name}`, async () => {
        await homePage.loginAndNavigate(account.accountId, account.seedPhrase);
        await swapPage.navigate();

        expect(swapPage.page).toHaveURL(/.*\/swap$/);

        await swapPage.fillForm({
            inId: TESTNET.NEAR.id,
            inAmount: swapAmount,
            outId: token.id,
        });

        const outInput = await swapPage.getOutputInput();
        const outAmount = await outInput.inputValue();

        expect(Number(outAmount) > 0).toBeTruthy();

        const nearBalanceBefore = await account.getUpdatedBalance();

        await swapPage.clickOnPreviewButton();
        await swapPage.confirmSwap();

        const resultElement = await swapPage.waitResultMessageElement();
        const resultMessage = await resultElement.innerText();

        expect(removeStringBrakes(resultMessage)).toMatch(
            getResultMessageRegExp({
                fromSymbol: TESTNET.NEAR.symbol,
                fromAmount: swapAmount,
                toSymbol: token.symbol,
                toAmount: outAmount,
                acceptableOutputDifference: 2,
            })
        );

        const nearBalanceAfter = await account.getUpdatedBalance();
        const formattedTotalAfter = format.formatNearAmount(nearBalanceAfter.total);
        const parsedTotalBefore = Number(
            format.formatNearAmount(nearBalanceBefore.total)
        );
        const spentInSwap = swapAmount + SWAP_FEE;

        expect(Number(formattedTotalAfter)).toBeCloseTo(
            parsedTotalBefore - spentInSwap,
            maxDecimalsToCheck
        );

        const tokenBalance = await account.getTokenBalance(token.id);

        tokenBalanceAfterSwap = formatAmount(tokenBalance, token.decimals);

        expect(tokenBalanceAfterSwap).toMatch(new RegExp(withoutLastChars(outAmount, 1)));

        await swapPage.clickOnContinueAfterSwapButton();
    });

    test(`should swap ${token.name} for NEAR`, async () => {
        await swapPage.fillForm({
            inId: token.id,
            inAmount: tokenBalanceAfterSwap,
            outId: TESTNET.NEAR.id,
            initialDelay: waitAfterSwapWhileBalancesLoading,
        });

        const outInput = await swapPage.getOutputInput();
        const outAmount = await outInput.inputValue();

        expect(Number(outAmount)).toBeCloseTo(swapAmount, maxDecimalsToCheck);

        const nearBalanceBefore = await account.getUpdatedBalance();
        const parsedTotalBefore = format.formatNearAmount(nearBalanceBefore.total);

        // Additional balance check after the first swap
        expect(Number(parsedTotalBefore)).toBeCloseTo(
            totalBalanceOnStart - swapAmount - SWAP_FEE,
            maxDecimalsToCheck
        );

        await swapPage.clickOnPreviewButton();
        await swapPage.confirmSwap();
        await swapPage.waitResultMessageElement();

        const nearBalanceAfter = await account.getUpdatedBalance();
        const formattedTotalAfter = format.formatNearAmount(nearBalanceAfter.total);

        const resultElement = await swapPage.waitResultMessageElement();
        const resultMessage = await resultElement.innerText();

        expect(removeStringBrakes(resultMessage)).toMatch(
            getResultMessageRegExp({
                fromSymbol: token.symbol,
                fromAmount: tokenBalanceAfterSwap,
                toSymbol: TESTNET.NEAR.symbol,
                toAmount: outAmount,
                acceptableOutputDifference: 2,
            })
        );

        expect(Number(formattedTotalAfter)).toBeCloseTo(
            Number(parsedTotalBefore) + swapAmount - SWAP_FEE,
            maxDecimalsToCheck
        );

        const tokenBalance = await account.getTokenBalance(token.id);

        expect(Number(formatAmount(tokenBalance, token.decimals))).toEqual(0);
    });
});
