interface EncryptionResult {
    payload: string;
    // iv: string;
    salt: string;
}

/**
 * Encrypts a data object that can be any serializable value using
 * a provided password.
 *
 * @param {string} cipherKey - password to use for encryption
 * @param {R} dataObj - data to encrypt
 * @returns {Promise<string>} cypher text
 */
function encrypt<R>(cipherKey: string, dataObj: R): Promise<EncryptionResult> {
    const salt = generateSalt();

    return keyFromPassword(cipherKey, salt)
        .then(function (passwordDerivedKey) {
            return encryptWithKey(passwordDerivedKey, dataObj);
        })
        .then(function ({ iv, data }) {
            return {
                salt,
                payload: JSON.stringify({
                    iv,
                    data,
                }),
            };
            // return JSON.stringify(payload);
        });
}

interface EncryptWithKeyResult {
    data: string;
    iv: string;
}

/**
 * Encrypts the provided serializable javascript object using the
 * provided CryptoKey and returns an object containing the cypher text and
 * the initialization vector used.
 * @param {CryptoKey} key - CryptoKey to encrypt with
 * @param {R} dataObj - Serializable javascript object to encrypt
 * @returns {EncryptWithKeyResult}
 */
function encryptWithKey<R>(key: CryptoKey, dataObj: R): Promise<EncryptWithKeyResult> {
    const data = JSON.stringify(dataObj);
    const dataBuffer = Buffer.from(data, 'utf-8');
    const vector = global.crypto.getRandomValues(new Uint8Array(16));
    return global.crypto.subtle
        .encrypt(
            {
                name: 'AES-GCM',
                iv: vector,
            },
            key,
            dataBuffer
        )
        .then((buf: ArrayBuffer) => {
            const buffer = new Uint8Array(buf);
            const vectorStr = Buffer.from(vector).toString('base64');
            const vaultStr = Buffer.from(buffer).toString('base64');
            return {
                data: vaultStr,
                iv: vectorStr,
            };
        });
}

/**
 * Given a password and a cypher text, decrypts the text and returns
 * the resulting value
 * @param {string} cipherKey - password to decrypt with
 * @param {string} salt
 * @param {string} payload
 */
function decrypt<R>(cipherKey: string, salt: string, payload: string): Promise<R> {
    const { iv, data } = JSON.parse(payload) as EncryptWithKeyResult;
    return keyFromPassword(cipherKey, salt).then(function (key) {
        return decryptWithKey(key, { data, iv });
    });
}

/**
 * Given a CryptoKey and an EncryptionResult object containing the initialization
 * vector (iv) and data to decrypt, return the resulting decrypted value.
 * @param {CryptoKey} key - CryptoKey to decrypt with
 * @param {EncryptWithKeyResult} payload - payload returned from an encryption method
 */
function decryptWithKey<R>(key: CryptoKey, payload: EncryptWithKeyResult): Promise<R> {
    const encryptedData = Buffer.from(payload.data, 'base64');
    const vector = Buffer.from(payload.iv, 'base64');
    return crypto.subtle
        .decrypt({ name: 'AES-GCM', iv: vector }, key, encryptedData)
        .then(function (result) {
            const decryptedData = new Uint8Array(result);
            const decryptedStr = Buffer.from(decryptedData).toString('utf-8');
            const decryptedObj = JSON.parse(decryptedStr);
            return decryptedObj;
        })
        .catch(function () {
            throw new Error('Likely incorrect crypto key given for decryption');
        });
}

/**
 * Generate a CryptoKey from a password and random salt
 * @param {string} password - The password to use to generate key
 * @param {string} salt - The salt string to use in key derivation
 */
function keyFromPassword(password: string, salt: string): Promise<CryptoKey> {
    const passBuffer = Buffer.from(password, 'utf-8');
    const saltBuffer = Buffer.from(salt, 'base64');

    return global.crypto.subtle
        .importKey('raw', passBuffer, { name: 'PBKDF2' }, false, [
            'deriveBits',
            'deriveKey',
        ])
        .then(function (key: CryptoKey) {
            return global.crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: saltBuffer,
                    iterations: 10000,
                    hash: 'SHA-256',
                },
                key,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
        });
}

/**
 * Generates a random string for use as a salt in CryptoKey generation
 * @param {number} byteCount - Number of bytes to generate
 * @returns {string} randomly generated string
 */
function generateSalt(byteCount = 32): string {
    const view = new Uint8Array(byteCount);
    global.crypto.getRandomValues(view);
    // Uint8Array is a fixed length array and thus does not have methods like pop, etc
    // so TypeScript complains about casting it to an array. Array.from() works here for
    // getting the proper type, but it results in a functional difference. In order to
    // cast, you have to first cast view to unknown then cast the unknown value to number[]
    // TypeScript ftw: double opt in to write potentially type-mismatched code.
    const b64encoded = btoa(String.fromCharCode.apply(null, view as unknown as number[]));
    return b64encoded;
}

export const EncryptionDecryptionUtils = {
    encrypt,
    decrypt,
};
