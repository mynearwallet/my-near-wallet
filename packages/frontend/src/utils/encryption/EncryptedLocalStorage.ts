import sha256 from 'js-sha256';
import nacl from 'tweetnacl';
import * as nearApiJs from 'near-api-js';

export class EncrytedLocalStorage {
    private key: Uint8Array;

    constructor(key: Uint8Array) {
        this.key = key;
    }

    getNonce() {
        return new Uint8Array(24);
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
                this.getNonce(),
                this.key
            ).toString()
        );
    }

    decrypt(value) {
        try {
            const serialized = window.atob(value)
                .split(',')
                .map((num: string) => parseInt(num, 10));

            const box = Uint8Array.from(serialized);
            const opened = nacl.secretbox.open(box, this.getNonce(), this.key);
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

export default EncrytedLocalStorage;
