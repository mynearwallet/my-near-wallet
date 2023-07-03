import reduceReducers from 'reduce-reducers';
import { handleActions } from 'redux-actions';

import { decrypt } from '../../actions/passwordEncryption';

const initialState: TDecryptedData = {
    decryptCheck: false,
    version: '1',
    accounts: [],
};

export type TDecryptedData = {
    decryptCheck: boolean;
    version: string;
    accounts: Array<TDecryptedData_Account>;
};

export type TDecryptedData_Account = {
    accountId: string;
    privateKey: string;
    seedPhrase: string | null;
};

const passwordEncryptionReducer = handleActions(
    {
        [decrypt]: (state, { error, payload }) => ({
            ...payload,
        }),
    },
    initialState
);

export default reduceReducers(passwordEncryptionReducer);
