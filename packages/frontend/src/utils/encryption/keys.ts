import sha256 from 'js-sha256';

import CONFIG from '../../config';
import { getActiveAccountId } from '../account';
import { KEYSTORE_PREFIX } from '../wallet';

export const ED25516_TAG = 'ed25519';

export const createKeyFrom = (value: string): Uint8Array =>
    Uint8Array.from(sha256.sha256.array(value));

export const isKeyEncrypted = (
    prefix: string,
    accountId: string,
    networkId: string
): boolean => {
    if (!accountId) {
        return false;
    }

    const accountSecretKey = `${prefix}${accountId}:${networkId}`;
    const key = localStorage.getItem(accountSecretKey);

    return !key.startsWith(ED25516_TAG);
};

export const isEncrypted = () => isKeyEncrypted(
    KEYSTORE_PREFIX,
    getActiveAccountId(),
    CONFIG.NETWORK_ID
);
