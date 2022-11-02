import * as nearApiJs from 'near-api-js';

import CONFIG from '../../../config';
import { getActiveAccountId } from '../../../utils/account';
import EncrytedLocalStorage from '../../../utils/encryption/EncryptedLocalStorage';
import { createKeyFrom } from '../../../utils/encryption/keys';
import { KEYSTORE_PREFIX } from '../../../utils/wallet';

export const isPasswordValid = async (password: string): Promise<boolean> => {
    const activeAccountId = getActiveAccountId();
    const keyStore = new nearApiJs.keyStores.BrowserLocalStorageKeyStore(
        new EncrytedLocalStorage(createKeyFrom(password)),
        KEYSTORE_PREFIX
    );

    const keyPair = await keyStore.getKey(CONFIG.NETWORK_ID, activeAccountId);

    return Boolean(keyPair);
};
