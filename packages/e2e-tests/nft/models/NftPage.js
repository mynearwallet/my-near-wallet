// @ts-check

class NftPage {
  /**
   * @type {import("@playwright/test").Page}
   */
  page;

  /**
   *
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async navigateToNftPage() {
    await this.page.goto(`/`);
    await this.page.locator(".tab-collectibles").click()
  }

  async clickFirstNft() {
    await this.page.getByRole('img', {name: 'NFT'}).first().click()
  }

  /**
   * 
   * @param {string} accountId 
   */
  async transferCurrentNftToAccount(accountId){
    await this.page.locator('[data-test-id="nft-transfer-button"]').click()
    await this.page.locator('[data-test-id="sendMoneyPageAccountIdInput"]').fill(accountId)
    await this.page.locator('[data-test-id="nft-transfer-next-1"]').click()
    await this.page.locator('[data-test-id="nft-transfer-next-2"]').click()
    await this.page.locator('[data-test-id="nft-transfer-next-3"]').click()
  }
}

module.exports = { NftPage };
