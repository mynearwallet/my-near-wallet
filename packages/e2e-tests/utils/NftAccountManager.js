// @ts-check
const BN = require("bn.js");

const { fetchNftContract } = require("../contracts");
const E2eTestAccount = require("./E2eTestAccount");
const { parseNearAmount } = require("near-api-js/lib/utils/format");

class NftAccountManager {
  nftSenderAccount;
  nftContractAccount;
  nftReceiverAccount;
  /**
   * @param {E2eTestAccount} bankAccount
   * Create random accounts for nft sender, receiver, and contract account
   * We will deploy NFT to contract account.
   *
   * The random accounts are all created as sub accounts of BANK_ACCOUNT
   */
  constructor(bankAccount) {
    this.nftSenderAccount = bankAccount.spawnRandomSubAccountInstance();
    this.nftContractAccount = bankAccount.spawnRandomSubAccountInstance();
    this.nftReceiverAccount = bankAccount.spawnRandomSubAccountInstance();
  }

  /**
   * This will init all the accounts, with the initial balance as follows:\
   * sender: 2\
   * nft_contract: 6\
   * receiver: 2\
   * 
   * And mint a NFT to sender account
   */
  async initialize() {
    const nftWasm = await fetchNftContract();
    await Promise.all([
      this.nftSenderAccount.create({ amount: "2.0" }),
      this.nftContractAccount.create({ amount: "6.0", contractWasm: nftWasm }),
      this.nftReceiverAccount.create({ amount: "2.0" }),
    ]);

    // init the NFT with default metadata
    await this.nftContractAccount.nearApiJsAccount?.functionCall({
      contractId: this.nftContractAccount.accountId,
      methodName: "new_default_meta",
      args: {
        owner_id: this.nftContractAccount.accountId,
      },
    });

    // mint NFT
    await this.nftContractAccount.nearApiJsAccount?.functionCall({
      contractId: this.nftContractAccount.accountId,
      methodName: "nft_mint",
      args: {
        token_id: "0",
        receiver_id: this.nftSenderAccount.accountId,
        token_metadata: {
          title: "Olympus Mons",
          description: "Tallest mountain in charted solar system",
          media:
            "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Olympus_Mons_alt.jpg/1024px-Olympus_Mons_alt.jpg",
          copies: 1,
        },
      },
      attachedDeposit: new BN(parseNearAmount("0.1") || ""),
    });

    return this;
  }

  async deleteAccounts() {
    await Promise.allSettled([
      this.nftSenderAccount.delete(),
      this.nftContractAccount.delete(),
      this.nftReceiverAccount.delete(),
    ]);
  }
}

module.exports = NftAccountManager;
