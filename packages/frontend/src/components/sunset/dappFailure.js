import { parse } from 'query-string';

import { actions as externalRedirectActions } from '../../redux/slices/externalRedirect';
import { addHashParams, addQueryParams } from '../../utils/buildUrl';
import convertUrlToSendMessage from '../../utils/convertUrlToSendMessage';
import { isUrlNotJavascriptProtocol } from '../../utils/helper-api';

/**
 * Failure answers for every kind of dApp request MyNearWallet refuses, so a dApp is never left
 * waiting. MyNearWallet tells popup and redirect integrations apart only by `window.opener`:
 *
 * - popup (near-connect): `postMessage` to the callback origin, then the same redirect after
 *   3 seconds for extensions that spoof `window.opener`;
 * - redirect (near-api-js, wallet-selector <= 8): straight to the callback, through the
 *   "You're leaving MyNearWallet" confirmation.
 *
 * Each returns false when there is no usable callback to answer, true once an answer is on its
 * way. Values are passed raw; `addQueryParams` encodes them exactly once.
 */

export const POPUP_FALLBACK_REDIRECT_MS = 3000;

const LOOPBACK_HOSTS = ['127.0.0.1', 'localhost', '[::1]'];

/** The callback each kind of request answers to, read straight from the request URL. */
export const readDappRequest = (kind, search) => {
    const params = parse(search);
    if (kind === 'login') {
        const successUrl = params.success_url;
        let isCli = false;
        try {
            isCli =
                !params.contract_id &&
                !params.failure_url &&
                LOOPBACK_HOSTS.includes(new URL(successUrl).hostname);
        } catch {
            isCli = false;
        }
        return {
            callbackUrl: params.failure_url,
            hostUrl: params.failure_url || successUrl,
            isCli,
        };
    }
    return {
        callbackUrl: params.callbackUrl,
        hostUrl: params.callbackUrl,
        meta: params.meta,
        isCli: false,
    };
};

export const isPopupRequest = () => typeof window !== 'undefined' && !!window.opener;

export const isUsableCallbackUrl = (url) =>
    typeof url === 'string' && url.length > 0 && isUrlNotJavascriptProtocol(url);

const answer = ({ dispatch, callbackUrl, redirectUrl, message }) => {
    if (isPopupRequest()) {
        setTimeout(() => {
            dispatch(externalRedirectActions.showExternalRedirect(redirectUrl));
        }, POPUP_FALLBACK_REDIRECT_MS);
        try {
            window.opener.postMessage(message, convertUrlToSendMessage(callbackUrl));
        } catch (error) {
            // The fallback redirect above still answers the dApp.
            console.warn('Could not post the failure to the opening app', error);
        }
        return true;
    }

    dispatch(externalRedirectActions.showExternalRedirect(redirectUrl));
    return true;
};

export const sendLoginFailure = ({
    dispatch,
    failureUrl,
    errorCode = 'USER_CANCELLED',
    errorMessage = 'User cancelled the Action',
}) => {
    if (!isUsableCallbackUrl(failureUrl)) {
        return false;
    }

    return answer({
        dispatch,
        callbackUrl: failureUrl,
        redirectUrl: failureUrl,
        message: { status: 'failure', errorCode, errorMessage },
    });
};

export const sendSignFailure = ({
    dispatch,
    callbackUrl,
    signMeta,
    errorCode = 'userRejected',
    errorMessage = 'User rejected transaction',
}) => {
    if (!isUsableCallbackUrl(callbackUrl)) {
        return false;
    }

    return answer({
        dispatch,
        callbackUrl,
        redirectUrl: addQueryParams(callbackUrl, { signMeta, errorCode, errorMessage }),
        message: { status: 'failure', signMeta, errorCode, errorMessage },
    });
};

export const sendSignMessageFailure = ({
    dispatch,
    callbackUrl,
    errorMessage = 'User rejected',
}) => {
    if (!isUsableCallbackUrl(callbackUrl)) {
        return false;
    }

    return answer({
        dispatch,
        callbackUrl,
        redirectUrl: addHashParams(callbackUrl, { error: errorMessage }),
        message: { status: 'failure', errorMessage },
    });
};

export const sendVerifyOwnerFailure = ({
    dispatch,
    callbackUrl,
    meta,
    errorMessage = 'User rejected',
}) => {
    if (!isUsableCallbackUrl(callbackUrl)) {
        return false;
    }

    // verify-owner has no popup integration; it only ever answers by redirect.
    dispatch(
        externalRedirectActions.showExternalRedirect(
            addQueryParams(callbackUrl, { meta, error: errorMessage })
        )
    );
    return true;
};
