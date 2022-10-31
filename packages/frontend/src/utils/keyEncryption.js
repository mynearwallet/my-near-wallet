import sha256 from 'js-sha256';
import nacl from 'tweetnacl';
import * as nearApiJs from 'near-api-js';
import CONFIG from "../config"; // todo
import {KEY_ACTIVE_ACCOUNT_ID, KEYSTORE_PREFIX} from "./wallet";

// todo TS

export const createKeyFrom = (value) => Uint8Array.from(sha256.sha256.array(value));

// const randombytes = function (r) {
//     for (let i = 0; i < r.length; i += 65536) {
//         crypto.getRandomValues(r.subarray(i, i + 65536));
//     }
// };

// todo https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt
window.createKeyFrom = createKeyFrom;

export class EncrytedLocalStorage {
    constructor(key) {
        console.log(key);
        this.key = key;
    }

    // rename
    getNonceForCurrentClient() {
        // todo
        return new Uint8Array(24);
        return createKeyFrom(window.navigator.userAgent);
    }

    setItem(key, value) {
        const encrypted = this.encrypt(value);
        window.localStorage.setItem(key, encrypted);
    }

    getItem(key) {
        const encrypted = window.localStorage.getItem(key);

        return this.decrypt(encrypted);
    }

    encrypt(value) {
        const encoder = new TextEncoder();
        return window.btoa(
            nacl.secretbox(
                encoder.encode(value),
                this.getNonceForCurrentClient(),
                this.key
            )
        );
    }

    decrypt(value) {
        try {
            const box = Uint8Array.from(window.atob(value).split(','));
            const opened = nacl.secretbox.open(box, this.getNonceForCurrentClient, this.key);
            if (opened === null) {
                return opened;
            }

            const decoder = new TextDecoder();
            return decoder.decode(opened);
        } catch (e) {
            console.error(e);
            return null;
        }
    }
}

// получается что если ручками убрать в лс этот ключ, то кошель будет думать что энкрипшна нет,
// поэтому при создании кейстораджа надо будет чекать является ли приватник шифрованным или нет (проверять по формату)
// export const KEY_ENCRYPTED_ACCOUNTS_WITH_PASS = 'wallet:encrypted';

let isAuthorized = false;

// export const isKeyEncrypted = async () => {
//     const activeAccountId = localStorage.getItem(KEY_ACTIVE_ACCOUNT_ID);
//     const accountSecretKey = `${KEYSTORE_PREFIX}${activeAccountId}:${CONFIG.NETWORK_ID}`;
//     const key = localStorage.getItem(accountSecretKey);
//
//     return !key.startsWith('ed25519') && !isAuthorized;
// };

/**
 * Takes nonce from current UserAgent
 * @returns {Uint8Array}
 */
export const isKeyValid = async (key, accountId) => {
    const keyStore = new nearApiJs.keyStores.BrowserLocalStorageKeyStore(
        new EncrytedLocalStorage(key),
        KEYSTORE_PREFIX
    );
    // console.log(keyStore)

    // console.log(NETWORK_ID);
    const encryptedKeyPair = await keyStore.getKey(CONFIG.NETWORK_ID, accountId);
    console.log(encryptedKeyPair);
    // if (!encryptedKeyPair) {
    //     // todo sentry
    //     console.error('Unexisted accountId');
    //
    //     return false;
    // }



    // const decrypted = decrypt(encryptedKeyPair.priv, getNonceForCurrentClient(), key)





    // return decrypt(encryptedValue, getNonceForCurrentClient(), key);
};

// export const encryptStatic = (key) =>
//     encrypt(STATIC, NONCE, key);

// export const setEncryptedStatic = (value) =>
//     localStorage.setItem(KEY_ENCRYPTED_ACCOUNTS_WITH_PASS, value);
