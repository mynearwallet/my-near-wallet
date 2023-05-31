import { createSlice } from '@reduxjs/toolkit';
import { push } from 'connected-react-router';
import { createSelector } from 'reselect';

import { MODAL_CHECKED_KEY } from '../../../components/accounts/Encryption/EncryptionModal';
import CONFIG from '../../../config';
import { EncryptionDecryptionUtils } from '../../../utils/encryption';
import { wallet } from '../../../utils/wallet';
import { showCustomAlert } from '../../actions/status';

const SLICE_NAME = 'login';

const encrypted = localStorage.getItem('NEAR_WALLET_ENCRYPTED');

const initialState = {
    loginState: encrypted ? 'denied' : 'granted',
    newPassword: '',
};

const loginSlice = createSlice({
    name: SLICE_NAME,
    initialState,
    reducers: {
        login: (state) => {
            state.loginState = 'granted';
        },
        logout: (state) => {
            state.loginState = 'denied';
        },
        settingUpPassword: (state, action) => {
            state.newPassword = action.payload.password;
        },
    },
});

export const selectLoginSlice = (state) => state[SLICE_NAME];

export const selectNewPassword = createSelector(
    selectLoginSlice,
    (login) => login.newPassword
);

export const hasEncryptedAccount = () => {
    return !!localStorage.getItem('NEAR_WALLET_ENCRYPTED');
};

export const isNewUser = () => {
    const hasPlainAccount = Object.keys(localStorage).some((e) =>
        e.includes('nearlib:keystore:')
    );

    return !hasPlainAccount && !hasEncryptedAccount();
};

export const login = (password) => async (dispatch) => {
    try {
        await wallet.unlockWallet(password || '');
        dispatch(loginSlice.actions.login());
        return true;
    } catch (err) {
        console.log(err);
        alert('Incorrect password');
        return false;
    }
};

export const clearPassword = () => (dispatch) => {
    dispatch(loginSlice.actions.settingUpPassword({ password: '' }));
};

export const navigateToNextRouteAndSavePassword =
    ({ hash, password, nextRoute }) =>
    (dispatch) => {
        dispatch(loginSlice.actions.settingUpPassword({ password }));
        dispatch(
            push({
                pathname: nextRoute,
                search: '',
                hash: hash || '',
            })
        );
    };

export const upgradeToEncryption = (password) => async (dispatch) => {
    const localStorageObj = { ...localStorage };
    const privateObjKeys = Object.keys(localStorageObj).filter((e) =>
        e.includes('nearlib:keystore:')
    );
    if (privateObjKeys.length > 0) {
        const encryptedAccounts = await Promise.all(
            privateObjKeys.map(async (key) => {
                const pKey = localStorageObj[key];
                const accountId = key
                    .replace('nearlib:keystore:', '')
                    .replace(`:${CONFIG.NETWORK_ID}`, '');

                const encrypted = await EncryptionDecryptionUtils.encrypt(password, {
                    privateKey: pKey,
                });
                return {
                    accountId,
                    salt: encrypted.salt,
                    payload: encrypted.payload,
                };
            })
        );
        localStorage.setItem('NEAR_WALLET_ENCRYPTED', JSON.stringify(encryptedAccounts));
        localStorage.setItem(MODAL_CHECKED_KEY, 'true');

        wallet.init();
        dispatch(
            showCustomAlert({
                success: true,
                messageCodeHeader: 'addPassword.success',
            })
        );
        await dispatch(login(password));
        dispatch(
            push({
                pathname: '/',
                search: '',
                state: {
                    globalAlertPreventClear: true,
                },
            })
        );
    }
};

export default loginSlice;
