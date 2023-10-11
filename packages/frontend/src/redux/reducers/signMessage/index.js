import { handleActions } from 'redux-actions';

import {
    SIGN_MESSAGE_STATUS,
    handleAuthorizationRequestConfirmed,
    handleAuthorizationRequestRejected,
} from '../../slices/signMessage';

const initialState = {
    status: SIGN_MESSAGE_STATUS.NEEDS_CONFIRMATION,
    signedRequest: {},
};

export default handleActions(
    {
        [handleAuthorizationRequestRejected]: (state) => ({
            ...state,
            signedRequest: undefined,
            status: SIGN_MESSAGE_STATUS.COMPLETED,
            error: new Error('User rejected'),
        }),
        [handleAuthorizationRequestConfirmed.pending]: (state) => ({
            ...state,
            status: SIGN_MESSAGE_STATUS.IN_PROGRESS,
            error: undefined,
        }),
        [handleAuthorizationRequestConfirmed.rejected]: (state, { error }) => ({
            ...state,
            status: SIGN_MESSAGE_STATUS.NEEDS_CONFIRMATION,
            error,
        }),
        [handleAuthorizationRequestConfirmed.fulfilled]: (state, { payload }) => ({
            ...state,
            signedRequest: payload,
            status: SIGN_MESSAGE_STATUS.COMPLETED,
            error: undefined,
        }),
    },
    initialState
);
