import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import SignMessageInvalid from '../components/sign-message/SignMessageInvalid';
import SignMessageSummaryWrapper from '../components/sign-message/SignMessageSummaryWrapper';
import { redirectTo } from '../redux/actions/account';
import {
    selectAccountUrlCallbackUrl,
    selectAccountUrlMessage,
    selectAccountUrlRecipient,
    selectAccountUrlNonce,
    selectAccountUrlState,
} from '../redux/slices/account';
import {
    handleAuthorizationRequestConfirmed,
    handleAuthorizationRequestRejected,
    selectSignMessageStatus,
    selectSignedRequest,
    selectSignMessageError,
    SIGN_MESSAGE_STATUS,
} from '../redux/slices/signMessage';
import { addHashParams } from '../utils/buildUrl';
import { isUrlNotJavascriptProtocol } from '../utils/helper-api';
import { validateNonce } from '../utils/signMessage';
import convertUrlToSendMessage from '../utils/convertUrlToSendMessage';

const buildRedirectUrl = (accountUrlCallbackUrl, signedRequest, state, error) => {
    if (!error) {
        return addHashParams(accountUrlCallbackUrl, { ...signedRequest, state });
    }
    return addHashParams(accountUrlCallbackUrl, {
        error: error?.message?.substring(0, 100) || 'Unknown error',
    });
};

const SignMessageWrapper = () => {
    const dispatch = useDispatch();

    // NEP-413 message inputs from URL
    const accountUrlMessage = useSelector(selectAccountUrlMessage);
    const accountUrlNonce = useSelector(selectAccountUrlNonce);
    const accountUrlRecipient = useSelector(selectAccountUrlRecipient);
    const accountUrlCallbackUrl = useSelector(selectAccountUrlCallbackUrl);
    const accountUrlState = useSelector(selectAccountUrlState);

    const verifyOwnerStatus = useSelector(selectSignMessageStatus);
    const verifyOwnerError = useSelector(selectSignMessageError);
    const signedRequest = useSelector(selectSignedRequest);
    const isValidCallbackUrl = isUrlNotJavascriptProtocol(accountUrlCallbackUrl);
    const isValidNonce = validateNonce(accountUrlNonce);
    const isSigning = verifyOwnerStatus === SIGN_MESSAGE_STATUS.IN_PROGRESS;

    useEffect(() => {
        if (verifyOwnerStatus === SIGN_MESSAGE_STATUS.COMPLETED) {
            if (window.opener) {
                setTimeout(() => {
                    if (accountUrlCallbackUrl && isValidCallbackUrl) {
                        window.location.href = buildRedirectUrl(
                            accountUrlCallbackUrl,
                            signedRequest,
                            accountUrlState,
                            verifyOwnerError
                        );
                    } else {
                        dispatch(redirectTo('/'));
                    }
                }, 3000);
                return window.opener.postMessage(
                    {
                        status: 'success',
                        accountUrlCallbackUrl,
                        signedRequest,
                        accountUrlState,
                        verifyOwnerError,
                    },
                    convertUrlToSendMessage(accountUrlCallbackUrl)
                );
            }
            if (accountUrlCallbackUrl && isValidCallbackUrl) {
                window.location.href = buildRedirectUrl(
                    accountUrlCallbackUrl,
                    signedRequest,
                    accountUrlState,
                    verifyOwnerError
                );
            } else {
                dispatch(redirectTo('/'));
            }
        }
    }, [verifyOwnerStatus]);

    const handleApproveRequest = async () =>
        dispatch(
            handleAuthorizationRequestConfirmed({
                message: accountUrlMessage,
                nonce: accountUrlNonce,
                recipient: accountUrlRecipient,
                callbackUrl: window.opener ? undefined : accountUrlCallbackUrl,
            })
        );

    const handleRejectRequest = async () => {
        dispatch(handleAuthorizationRequestRejected());
    };

    // potentially malicious callback URL found
    // or nonce did not respect the format
    if (!isValidCallbackUrl || !isValidNonce) {
        return <SignMessageInvalid />;
    }

    return (
        <SignMessageSummaryWrapper
            onClickCancel={handleRejectRequest}
            onClickApprove={handleApproveRequest}
            signing={isSigning}
            message={accountUrlMessage}
            isValidCallbackUrl={isValidCallbackUrl}
            isValidNonce={isValidNonce}
        />
    );
};

export default SignMessageWrapper;
