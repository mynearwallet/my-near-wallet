import sha256 from 'js-sha256';

const ED25516_TAG = 'ed25519';

export const createKeyFrom = (value: string): Uint8Array =>
    Uint8Array.from(sha256.sha256.array(value));

export const isKeyEncrypted = (
    prefix: string,
    accountId: string,
    networkId: string
): boolean => {
    const accountSecretKey = `${prefix}${accountId}:${networkId}`;
    const key = localStorage.getItem(accountSecretKey);

    return !key.startsWith(ED25516_TAG);
};
