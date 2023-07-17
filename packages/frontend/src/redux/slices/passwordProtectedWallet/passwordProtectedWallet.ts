import { createSlice } from '@reduxjs/toolkit';

import {
    storedWalletDataActions,
    TStoredWalletDataStatus,
} from '../../../utils/encryptedWalletData';

/****************************/
// Var declarations
/****************************/
const SLICE_NAME = 'passwordEncryption';

interface IUserPasswordProtectedData {
    dataStatus: TStoredWalletDataStatus;
    isSignedIn: boolean;
}

const initialState: IUserPasswordProtectedData = {
    dataStatus: storedWalletDataActions.getStatus(),
    isSignedIn: false,
};

/****************************/
// Slice
/****************************/
const passwordProtectedWallet = createSlice({
    name: SLICE_NAME,
    initialState,
    reducers: {
        signIn(state) {
            state.isSignedIn = true;
            state.dataStatus = storedWalletDataActions.getStatus();
        },
    },
});

export const selectPasswordProtectionSlice = (state): IUserPasswordProtectedData =>
    state[SLICE_NAME];

export default passwordProtectedWallet;
