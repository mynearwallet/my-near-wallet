import sha256 from 'js-sha256';
import nacl from 'tweetnacl';
import * as nearApiJs from 'near-api-js';

export class EncrytedLocalStorage {
    private key: Uint8Array;

    constructor(key: Uint8Array) {
        this.key = key;
    }

    getNonce(): Uint8Array {
        return new Uint8Array(24);
    }

    setItem(key: string, value: string): void {
        const encrypted = this.encrypt(value);
        window.localStorage.setItem(key, encrypted);
    }

    getItem(key: string): string|null {
        const encrypted = window.localStorage.getItem(key);

        return this.decrypt(encrypted);
    }

    removeItem(key: string): void {
        window.localStorage.removeItem(key);;
    }

    encrypt(value: string): string {
        const encoder = new TextEncoder();
        return window.btoa(
            nacl.secretbox(
                encoder.encode(value),
                this.getNonce(),
                this.key
            ).toString()
        );
    }

    decrypt(value: string): string|null {
        try {
            const serialized = window.atob(value)
                .split(',')
                .map((num: string) => parseInt(num, 10));

            const box = Uint8Array.from(serialized);
            const opened = nacl.secretbox.open(box, this.getNonce(), this.key);

            if (opened === null) {
                return null;
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
