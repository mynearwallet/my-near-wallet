import { KEYSTORE_PREFIX, wallet } from '../../../../utils/wallet';
import * as nearApiJs from 'near-api-js';
import CONFIG from '../../../../config';
import { ED25516_TAG } from '../../../../utils/encryption/keys';
import { KeyPairEd25519 } from 'near-api-js/lib/utils/key_pair';

export const encryptWallet = async (password: string): Promise<void> => {
    const keyStore = new nearApiJs.keyStores.BrowserLocalStorageKeyStore(
        window.localStorage,
        KEYSTORE_PREFIX
    );

    wallet.injectEncryptedKeyStore(password);
    const allAccounts = wallet.getAccountsLocalStorage();
    for (let accountId in allAccounts) {
        const keyPair = await keyStore.getKey(CONFIG.NETWORK_ID, accountId) as KeyPairEd25519;

        if (keyPair !== null && !keyPair.secretKey.startsWith(ED25516_TAG)) {
            wallet.keyStore.setKey(CONFIG.NETWORK_ID, accountId, keyPair);
        }
    }
};
