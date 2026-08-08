const PRIVATE_KEY_MASK_CHARACTERS =
    '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

const randomCharacter = () => {
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
        const values = new Uint32Array(1);
        window.crypto.getRandomValues(values);
        return PRIVATE_KEY_MASK_CHARACTERS[
            values[0] % PRIVATE_KEY_MASK_CHARACTERS.length
        ];
    }

    return PRIVATE_KEY_MASK_CHARACTERS[
        Math.floor(Math.random() * PRIVATE_KEY_MASK_CHARACTERS.length)
    ];
};

export const createPrivateKeyMask = (privateKey) => {
    if (typeof privateKey !== 'string' || privateKey.length === 0) {
        return '';
    }

    const separatorIndex = privateKey.indexOf(':');
    const keyPrefix = separatorIndex >= 0 ? privateKey.slice(0, separatorIndex + 1) : '';
    const randomLength = privateKey.length - keyPrefix.length;

    return (
        keyPrefix + Array.from({ length: randomLength }, () => randomCharacter()).join('')
    );
};
