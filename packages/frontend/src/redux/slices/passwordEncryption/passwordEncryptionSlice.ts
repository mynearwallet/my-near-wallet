import { createSlice } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';

/****************************/
// Var declarations
/****************************/
const SLICE_NAME = 'passwordEncryption';
const selectPasswordEncryptionSlice = (state) => state[SLICE_NAME];

const initialState: TDecryptedData = {
    decryptCheck: false,
    version: '1',
    derivedPassword: undefined,
    accounts: [],
};

/****************************/
// Slice
/****************************/
const passwordEncryptionSlice = createSlice({
    name: SLICE_NAME,
    initialState,
    reducers: {
        decrypt(state, { payload }) {
            state.accounts = payload.accounts;
            state.derivedPassword = payload.derivedPassword;
        },
    },
});

/****************************/
// Export statements
/****************************/
export const selectDecryptedAccounts = createSelector(
    selectPasswordEncryptionSlice,
    ({ accounts }) => accounts
);
export const selectDerivedPassword = createSelector(
    selectPasswordEncryptionSlice,
    ({ derivedPassword }) => derivedPassword
);
export default passwordEncryptionSlice;

/****************************/
// Type Declarations
/****************************/

export type TDecryptedData = {
    decryptCheck: boolean;
    version: string;
    derivedPassword?: string;
    accounts: Array<TDecryptedData_Account>;
};

export type TDecryptedData_Account = {
    accountId: string;
    privateKey: string;
    seedPhrase: string | null;
};
