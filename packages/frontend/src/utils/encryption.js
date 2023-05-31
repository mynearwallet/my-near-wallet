function generateSalt(byteCount = 32) {
    const view = new Uint8Array(byteCount);
    crypto.getRandomValues(view);
    // Uint8Array is a fixed length array and thus does not have methods like pop, etc
    // so TypeScript complains about casting it to an array. Array.from() works here for
    // getting the proper type, but it results in a functional difference. In order to
    // cast, you have to first cast view to unknown then cast the unknown value to number[]
    // TypeScript ftw: double opt in to write potentially type-mismatched code.
    const buf = Buffer.from(String.fromCharCode.apply(null, view));
    const b64encoded = buf.toString('base64');
    return b64encoded;
}

/**
 * Generate a CryptoKey from a password and random salt
 * @param {string} password - The password to use to generate key
 * @param {string} salt - The salt string to use in key derivation
 *
 */
async function keyFromPassword(password, salt) {
    const passBuffer = Buffer.from(password, 'utf-8');
    const saltBuffer = Buffer.from(salt, 'base64');

    const key = await crypto.subtle.importKey(
        'raw',
        passBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );
    return crypto.subtle.deriveKey(
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
}

/**
 * Encrypts the provided serializable javascript object using the
 * provided CryptoKey and returns an object containing the cypher text and
 * the initialization vector used.
 * @param {CryptoKey} key - CryptoKey to encrypt with
 * @param {R} dataObj - Serializable javascript object to encrypt
 * @returns {EncryptWithKeyResult}
 */
async function encryptWithKey(key, dataObj) {
    const data = JSON.stringify(dataObj);
    const dataBuffer = Buffer.from(data, 'utf-8');
    const vector = crypto.getRandomValues(new Uint8Array(16));
    const buf = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: vector,
        },
        key,
        dataBuffer
    );
    const buffer = new Uint8Array(buf);
    const vectorStr = Buffer.from(vector).toString('base64');
    const vaultStr = Buffer.from(buffer).toString('base64');
    return {
        data: vaultStr,
        iv: vectorStr,
    };
}

const encrypt = async (cipherKey, dataObj) => {
    const salt = generateSalt();
    console.log(salt);
    const passwordDerivedKey = await keyFromPassword(cipherKey, salt);
    const { iv, data } = await encryptWithKey(passwordDerivedKey, dataObj);
    return {
        salt,
        payload: JSON.stringify({
            iv,
            data,
        }),
    };
};

async function decryptWithKey(key, payload) {
    const encryptedData = Buffer.from(payload.data, 'base64');
    const vector = Buffer.from(payload.iv, 'base64');
    try {
        const result = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: vector },
            key,
            encryptedData
        );
        const decryptedData = new Uint8Array(result);
        const decryptedStr = Buffer.from(decryptedData).toString('utf-8');
        const decryptedObj = JSON.parse(decryptedStr);
        return decryptedObj;
    } catch (_error) {
        throw new Error('Likely incorrect crypto key given for decryption');
    }
}

/**
 * Given a password and a cypher text, decrypts the text and returns
 * the resulting value
 * @param {string} cipherKey - password to decrypt with
 * @param {string} salt
 * @param {string} payload
 */
async function decrypt(cipherKey, salt, payload) {
    const { iv, data } = JSON.parse(payload);
    const key = await keyFromPassword(cipherKey, salt);
    return await decryptWithKey(key, { data, iv });
}

export const EncryptionDecryptionUtils = {
    encrypt,
    decrypt,
};
