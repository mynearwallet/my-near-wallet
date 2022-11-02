import CONFIG from '../../../../../config';
import { getActiveAccountId } from '../../../../../utils/account';
import { isKeyEncrypted } from '../../../../../utils/encryption/keys';
import { KEYSTORE_PREFIX } from '../../../../../utils/wallet';

export const isEncrypted = () => isKeyEncrypted(
    KEYSTORE_PREFIX,
    getActiveAccountId(),
    CONFIG.NETWORK_ID
);
