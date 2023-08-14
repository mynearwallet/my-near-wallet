const assert = require('assert');

const { Connection, InMemorySigner, Account } = require('near-api-js');

const nearApiJsConnection = require('./connectionSingleton');
const E2eTestAccount = require('./E2eTestAccount');
const SelfReloadingJSONRpcProvider = require('./SelfReloadingJSONRpcProvider');
const { WALLET_NETWORK } = require('../constants');

class SelfReloadingE2eTestAccount extends E2eTestAccount {
    constructor(...args) {
        const config = nearApiJsConnection.config;
        assert(
            config.networkId === WALLET_NETWORK.TESTNET,
            'cannot instantiate non testnet instance of SelfReloadingE2eTestAccount'
        );
        super(...args);
    }
    async connectToNearApiJs() {
        const config = nearApiJsConnection.config;
        this.nearApiJsAccount = new Account(
            new Connection(
                config.networkId,
                new SelfReloadingJSONRpcProvider(config.nodeUrl),
                new InMemorySigner(config.keyStore)
            ),
            this.accountId
        );
        await this.nearApiJsAccount.state();
    }
}

module.exports = SelfReloadingE2eTestAccount;
