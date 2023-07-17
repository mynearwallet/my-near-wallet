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
};

/****************************/
// Slice
/****************************/
const passwordEncryptionSlice = createSlice({
    name: SLICE_NAME,
    initialState,
    reducers: {
        decrypt(state, { payload }) {
            state.derivedPassword = payload.derivedPassword;
        },
    },
});

/****************************/
// Export statements
/****************************/
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
};

// export type TDecryptedData_Account = {
//     accountId: string;
//     privateKey: string;
//     seedPhrase: string | null;
// };
