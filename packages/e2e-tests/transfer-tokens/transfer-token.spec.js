// @ts-check

const BN = require('bn.js');
const nearApi = require('near-api-js');
const { parseNearAmount } = require('near-api-js/lib/utils/format');

const { SendMoneyPage } = require('./models/SendMoney');
const { CONTRACT } = require('../constants');
const { test, expect } = require('../playwrightWithFixtures');
const { HomePage } = require('../register/models/Home');
const { NEP141_TOKENS, SWAP_FEE } = require('../swap/constants');
const { SwapPage } = require('../swap/models/Swap');
const {
    removeStringBrakes,
    getResultMessageRegExp,
    withoutLastChars,
} = require('../swap/utils');
const { formatAmount } = require('../utils/amount');

const { describe, beforeAll, afterEach, beforeEach, afterAll } = test;
const { TESTNET } = CONTRACT;
const {
    utils: { format },
} = nearApi;

describe('Transferring NEAR tokens between two accounts', () => {
    let firstAccount;

    beforeAll(async ({ bankAccount }) => {
        firstAccount = bankAccount.spawnRandomSubAccountInstance();
        await firstAccount.create();
    });

    afterAll(async () => {
        await firstAccount.delete();
    });

    test('navigates to send money page', async ({ page }) => {
        const firstAccountHomePage = new HomePage(page);

        await firstAccountHomePage.navigate();

        await firstAccountHomePage.loginWithSeedPhraseLocalStorage(
            firstAccount.accountId,
            firstAccount.seedPhrase
        );

        await firstAccountHomePage.navigate();

        await firstAccountHomePage.clickSendButton();

        await expect(firstAccountHomePage.page).toHaveURL(/send-money$/);
    });
    describe('sending between accounts', () => {
        let secondAccount;

        beforeEach(async ({ bankAccount }) => {
            secondAccount = bankAccount.spawnRandomSubAccountInstance();
            await secondAccount.create();
        });

        afterEach(async () => {
            await secondAccount.delete();
        });

        test('is able to send NEAR tokens', async ({ page }) => {
            const firstAccountHomePage = new HomePage(page);

            await firstAccountHomePage.navigate();

            await firstAccountHomePage.loginWithSeedPhraseLocalStorage(
                firstAccount.accountId,
                firstAccount.seedPhrase
            );
            const firstAccountSendMoneyPage = new SendMoneyPage(page);

            const balanceBefore = await secondAccount.getUpdatedBalance();
            const transferAmount = 0.1;

            await firstAccountSendMoneyPage.navigate();

            await firstAccountSendMoneyPage.selectAsset('NEAR');
            await firstAccountSendMoneyPage.waitForTokenBalance();
            await firstAccountSendMoneyPage.typeAndSubmitAmount(transferAmount);
            await firstAccountSendMoneyPage.typeAndSubmitAccountId(
                secondAccount.accountId
            );
            await firstAccountSendMoneyPage.confirmTransaction();

            await expect(
                page.locator('data-test-id=sendTransactionSuccessMessage')
            ).toHaveText(new RegExp(`${transferAmount} NEAR`));
            await expect(
                page.locator('data-test-id=sendTransactionSuccessMessage')
            ).toHaveText(new RegExp(secondAccount.accountId));

            const balanceAfter = await secondAccount.getUpdatedBalance();
            const totalAfter = new BN(balanceAfter.total);
            const totalBefore = new BN(balanceBefore.total);
            const transferedAmount = new BN(
                parseNearAmount(transferAmount.toString()) || ''
            );

            expect(totalAfter.eq(totalBefore.add(transferedAmount))).toBe(true);
        });

        test('is able to send non NEAR tokens', async ({ page }) => {
            const swapAmount = 0.5;
            const firstAccountHomePage = new HomePage(page);
            const swapPage = new SwapPage(page);
            const firstAccountSendMoneyPage = new SendMoneyPage(page);
            await firstAccountHomePage.loginAndNavigate(
                firstAccount.accountId,
                firstAccount.seedPhrase
            );
            await swapPage.navigate();

            expect(swapPage.page).toHaveURL(/.*\/swap$/);
            const token = NEP141_TOKENS.TESTNET[0];
            await swapPage.fillForm({
                inId: TESTNET.NEAR.id,
                inAmount: swapAmount,
                outId: token.id,
            });

            const outInput = await swapPage.getOutputInput();
            const outAmount = await outInput.inputValue();

            expect(Number(outAmount) > 0).toBeTruthy();

            const nearBalanceBefore = await firstAccount.getUpdatedBalance();

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

            const nearBalanceAfter = await firstAccount.getUpdatedBalance();
            const formattedTotalAfter = format.formatNearAmount(nearBalanceAfter.total);
            const parsedTotalBefore = Number(
                format.formatNearAmount(nearBalanceBefore.total)
            );
            const spentInSwap = swapAmount + SWAP_FEE;

            expect(Number(formattedTotalAfter)).toBeCloseTo(
                parsedTotalBefore - spentInSwap,
                2
            );

            const tokenBalance = await firstAccount.getTokenBalance(token.id);
            const tokenBalanceAfterSwap = formatAmount(tokenBalance, token.decimals);
            expect(tokenBalanceAfterSwap).toMatch(
                new RegExp(withoutLastChars(outAmount, 1))
            );
            await swapPage.clickOnContinueAfterSwapButton();

            const balanceBefore = await secondAccount.getTokenBalance(token.id);
            await firstAccountSendMoneyPage.navigate();
            await page.waitForTimeout(5000);

            await firstAccountSendMoneyPage.selectAsset(token.id);
            await firstAccountSendMoneyPage.waitForTokenBalance();
            const maxTokenString =
                (await page
                    .locator(
                        '[data-test-id="sendPageSelectedTokenBalance"] > div.amount > div'
                    )
                    .getAttribute('title')) || '';
            const [maxTokenPure] = maxTokenString.split(' ');
            const maxToken = Number(maxTokenPure);
            const transferAmount = Math.min(maxToken, 1);
            await firstAccountSendMoneyPage.typeAndSubmitAmount(transferAmount);
            await firstAccountSendMoneyPage.typeAndSubmitAccountId(
                secondAccount.accountId
            );
            await firstAccountSendMoneyPage.confirmTransaction();

            await expect(
                page.locator('data-test-id=sendTransactionSuccessMessage')
            ).toHaveText(new RegExp(`${transferAmount} ${token.symbol}`));
            await expect(
                page.locator('data-test-id=sendTransactionSuccessMessage')
            ).toHaveText(new RegExp(secondAccount.accountId));

            const balanceAfter = await secondAccount.getTokenBalance(token.id);
            const totalAfter = Number(formatAmount(balanceAfter, token.decimals));
            const totalBefore = Number(formatAmount(balanceBefore, token.decimals));

            expect(totalAfter).toBe(totalBefore + transferAmount);
        });
    });
});
