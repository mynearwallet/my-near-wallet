import { createAsyncThunk, createAction } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';

import { messageToSign } from '../../../utils/signMessage';
import { wallet } from '../../../utils/wallet';
import { showCustomAlert } from '../../actions/status';
import { selectAccountId } from '../account';

const SLICE_NAME = 'signMessage';

export const signMessageSlice = (state) => state[SLICE_NAME];

export const SIGN_MESSAGE_STATUS = {
    IN_PROGRESS: 'sign-message-in-progress',
    NEEDS_CONFIRMATION: 'sign-message-needs-confirmation',
    COMPLETED: 'sign-message-completed',
};

export const selectSignMessageStatus = createSelector(
    [signMessageSlice],
    (signMessage) => signMessage.status
);

export const selectSignedRequest = createSelector(
    [signMessageSlice],
    (signMessage) => signMessage.signedRequest || {}
);

export const selectSignMessageError = createSelector(
    [signMessageSlice],
    (signMessage) => signMessage.error
);

export const handleAuthorizationRequestRejected = createAction(
    'handleAuthorizationRequestRejected'
);

export const handleAuthorizationRequestConfirmed = createAsyncThunk(
    `${SLICE_NAME}/handleAuthorizationRequestConfirmed`,
    async ({ message, nonce, recipient, callbackUrl }, thunkAPI) => {
        const { dispatch, getState } = thunkAPI;
        try {
            const accountId = selectAccountId(getState());
            const publicKey = await wallet.getPublicKeyAllowNonFundedAccount(accountId);

            const encodedMessage = messageToSign({
                message,
                nonce,
                recipient,
                callbackUrl,
            });

            const signed = await wallet.signMessageAllowNonFundedAccountAndVerify(
                encodedMessage,
                accountId
            );

            if (signed.signed.publicKey.toString() !== publicKey.toString()) {
                throw new Error(
                    // eslint-disable-next-line quotes
                    "The key used for signing and the public key used inside the data message do not match. Can't create a verified response."
                );
            }

            return {
                accountId,
                signature: Buffer.from(signed.signed.signature).toString('base64'),
                publicKey: signed.signed.publicKey.toString(),
            };
        } catch (error) {
            dispatch(
                showCustomAlert({
                    success: false,
                    messageCodeHeader: 'error',
                    messageCode: `reduxActions.${error.code}`,
                    errorMessage: error.message,
                })
            );
            throw error;
        }
    },
    {
        condition: (_, thunkAPI) => {
            const { getState } = thunkAPI;
            if (selectSignMessageStatus(getState()) === SIGN_MESSAGE_STATUS.IN_PROGRESS) {
                return false;
            }
        },
    }
);
