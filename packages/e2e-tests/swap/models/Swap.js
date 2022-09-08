class SwapPage {
    constructor(page) {
        this.page = page;
    }

    async navigate() {
        await this.page.goto('/swap');
    }

    async typeInputAmount(amount) {
        await this.page.fill(
            'data-test-id=swapPageInputAmountField',
            amount.toString()
        );
    }

    async selectInputAsset(contractName) {
        await this.page.click(`data-test-id=swapPageInputTokenSelector`);
        await this.page.click(
            `data-test-id=token-selection-${contractName}`
        );
    }

    async selectOutputAsset(contractName) {
        await this.page.click(`data-test-id=swapPageOutputTokenSelector`);
        await this.page.click(
            `data-test-id=token-selection-${contractName}`
        );
    }

    async waitForOutputAmount() {
        // wait for the balance display to contain any character more than 0
        await this.page.waitForSelector(
            '[data-test-id=swapPageOutputAmountField] >> div:text-matches("[1-9]")'
        );
    }

    async confirmSwap() {
        await this.page.click("data-test-id=swapPageSwapConfirmationButton");
    }
}

module.exports = { SwapPage };
