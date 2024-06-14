const BN = require('bn.js');
const {
    utils: {
        format: { parseNearAmount },
        KeyPairEd25519,
    },
} = require('near-api-js');

const nearApiJsConnection = require('./connectionSingleton');
const { fetchLinkdropContract } = require('../contracts');

class LinkdropAccountManager {
    // Create random accounts for linkdrop sender, receiver and contract account and deploy linkdrop contract to the contract account
    // The random accounts are created as subaccounts of BANK_ACCOUNT
    constructor(bankAccount) {
        this.linkdropSenderAccount = bankAccount.spawnRandomSubAccountInstance();
        this.linkdropContractAccount = bankAccount.spawnRandomSubAccountInstance();
        this.linkdropReceiverAccount = bankAccount.spawnRandomSubAccountInstance();
    }
    async initialize(senderNearBalance) {
        await Promise.all([
            this.linkdropSenderAccount.create({ amount: senderNearBalance }),
            fetchLinkdropContract().then((contractWasm) =>
                this.linkdropContractAccount.create({ amount: '5.0', contractWasm })
            ),
            this.linkdropReceiverAccount.create(),
        ]);
        return this;
    }
    async send(nearAmount) {
        const { publicKey, secretKey } = KeyPairEd25519.fromRandom();
        await this.linkdropSenderAccount.nearApiJsAccount.functionCall(
            this.linkdropContractAccount.accountId,
            'send',
            { public_key: publicKey.toString() },
            null,
            new BN(parseNearAmount(nearAmount))
        );
        this.lastSecretKey = secretKey;
        return secretKey;
    }
    async sendToNetworkTLA(nearAmount) {
        const { publicKey, secretKey } = KeyPairEd25519.fromRandom();
        await this.linkdropSenderAccount.nearApiJsAccount.functionCall(
            nearApiJsConnection.config.networkId,
            'send',
            { public_key: publicKey.toString() },
            null,
            new BN(parseNearAmount(nearAmount))
        );
        return secretKey;
    }
    deleteAccounts() {
        return Promise.allSettled([
            this.linkdropSenderAccount.delete(),
            this.linkdropContractAccount.delete(),
            this.linkdropReceiverAccount.delete(),
        ]);
    }
    async mockCreateAccount(page) {
        return page.route(
            nearApiJsConnection.getDefaultConfig().nodeUrl,
            async (route) => {
                const postData = route.request().postDataJSON();
                if (
                    postData.method === 'EXPERIMENTAL_tx_status' ||
                    postData.params.account_id === 'ref-finance-101.testnet'
                ) {
                    const json = {
                        jsonrpc: '2.0',
                        id: 5000,
                        result: {
                            block_hash: 'GLmmExoi7nLhRgG5CnZVBMf3CGcEwtBpTtemMDVRFQbZ',
                            block_height: 157884806,
                            logs: [],
                            result: [34, 48, 34],
                        },
                    };
                    await route.fulfill({
                        status: 200,
                        body: JSON.stringify(json),
                    });
                } else {
                    route.continue();
                }
            }
        );
    }
}

module.exports = LinkdropAccountManager;
