const fetch = require('node-fetch');

const nearApiJsConnection = require('../utils/connectionSingleton');
const { getKeyPairFromSeedPhrase } = require('../utils/helpers');

/**
 * @param {*} accountId
 * @param {*} seedPhrase
 * @returns {Promise<boolean>}
 */
const createAccountWithHelper = async (accountId, seedPhrase) => {
    const { publicKey } = getKeyPairFromSeedPhrase(seedPhrase);
    let success = true;

    await fetch(`${nearApiJsConnection.config.helperUrl}/account`, {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({
            newAccountId: accountId,
            newAccountPublicKey: publicKey.toString(),
        }),
    }).catch((err) => {
        console.log(err);
        success = false;
    });

    return success;
};

module.exports = {
    createAccountWithHelper,
};
