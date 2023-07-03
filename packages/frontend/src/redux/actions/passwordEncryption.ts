import { createActions } from 'redux-actions';

import { TDecryptedData } from '../reducers/passwordEncryption';

export const { decrypt } = createActions({
    DECRYPT: (decryptedData: TDecryptedData) => ({ decryptedData }),
});
