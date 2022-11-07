import * as nearApiJs from 'near-api-js';

import { KeyPairEd25519 } from 'near-api-js/lib/utils/key_pair';
import CONFIG from '../../config';
import { KEYSTORE_PREFIX, wallet } from '../wallet';
import { ED25516_TAG } from './keys';

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
