import * as nearApiJs from 'near-api-js';

import { KeyPairEd25519 } from 'near-api-js/lib/utils/key_pair';
import CONFIG from '../../config';
import { KEYSTORE_PREFIX, wallet } from '../wallet';
import { createKeyFrom, ED25516_TAG } from './keys';
import EncrytedLocalStorage from "./EncryptedLocalStorage";

export const encryptWalletKeys = async (password: string): Promise<void> => {
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

export const decryptWalletKeys = async (password: string): Promise<void> => {
    const encryptedkeyStore = new nearApiJs.keyStores.BrowserLocalStorageKeyStore(
        new EncrytedLocalStorage(createKeyFrom(password)),
        KEYSTORE_PREFIX
    );

    const decryptedkeyStore = new nearApiJs.keyStores.BrowserLocalStorageKeyStore(
        window.localStorage,
        KEYSTORE_PREFIX
    );

    const allAccounts = wallet.getAccountsLocalStorage();

    for (let accountId in allAccounts) {
        const keyPair = await encryptedkeyStore.getKey(CONFIG.NETWORK_ID, accountId) as KeyPairEd25519;
        await encryptedkeyStore.removeKey(CONFIG.NETWORK_ID, accountId);
        await decryptedkeyStore.setKey(CONFIG.NETWORK_ID, accountId, keyPair);
    }

    wallet.injectKeyStore(decryptedkeyStore);
};
