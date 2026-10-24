/**
 * SignDelegateActionWrapper - Route handler for NEP-366 meta-transaction signing
 *
 * This component handles the /sign-delegate-action route, enabling gasless transactions
 * where users sign a DelegateAction that can be submitted by a relayer.
 *
 * Supports TWO flows:
 *
 * 1. Wallet Selector Compatible (preferred):
 *    - delegateActionBase64: Pre-built DelegateAction (Borsh-serialized, base64-encoded)
 *    - callbackUrl: URL to redirect after signing
 *    - meta: Optional metadata
 *
 * 2. Open-ended flow (for x402 and similar use cases):
 *    - receiverId: The contract to call
 *    - actions: JSON array of actions to execute
 *    - callbackUrl: URL to redirect after signing
 *    - meta: Optional metadata
 *
 * @see https://github.com/near/NEPs/pull/366
 * @see https://github.com/near/wallet-selector
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Translate } from 'react-localize-redux';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { parse as parseQueryString } from 'query-string';

import SignDelegateAction from '../components/sign-delegate-action/SignDelegateAction';
import SignDelegateActionInvalid from '../components/sign-delegate-action/SignDelegateActionInvalid';
import { Mixpanel } from '../mixpanel';
import { redirectTo } from '../redux/actions/account';
import { selectAccountId } from '../redux/slices/account';
import { actions as externalRedirectActions } from '../redux/slices/externalRedirect';
import { addQueryParams } from '../utils/buildUrl';
import { isUrlNotJavascriptProtocol } from '../utils/helper-api';
import convertUrlToSendMessage from '../utils/convertUrlToSendMessage';
import {
    createSignedDelegateAction,
    signPrebuiltDelegateAction,
    decodeDelegateActionForDisplay,
    parseActionsFromQuery,
    validateDelegateActionParams,
    isLedgerAccount,
} from '../utils/wallet/delegateAction';

const SIGN_STATUS = {
    IDLE: 'idle',
    IN_PROGRESS: 'in-progress',
    SUCCESS: 'success',
    ERROR: 'error',
};

const SignDelegateActionWrapper = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const accountId = useSelector(selectAccountId);

    const [status, setStatus] = useState(SIGN_STATUS.IDLE);
    const [error, setError] = useState(null);
    const [params, setParams] = useState(null);
    const [parseError, setParseError] = useState(null);
    const [isLedger, setIsLedger] = useState(false);

    // Check if account uses Ledger
    useEffect(() => {
        if (!accountId) {
            return;
        }

        let cancelled = false;
        isLedgerAccount(accountId).then((value) => {
            if (!cancelled) {
                setIsLedger(value);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [accountId]);

    // Parse URL parameters on mount
    useEffect(() => {
        try {
            const query = parseQueryString(location.search);

            const callbackUrl = query.callbackUrl;
            const meta = query.meta ? JSON.parse(query.meta) : null;
            const delegateActionBase64 = query.delegateActionBase64;

            if (!callbackUrl) {
                throw new Error('Missing required parameter: callbackUrl');
            }

            // Flow 1: Wallet Selector compatible (pre-built DelegateAction)
            if (delegateActionBase64) {
                const decoded = decodeDelegateActionForDisplay(delegateActionBase64);
                setParams({
                    delegateActionBase64,
                    receiverId: decoded.receiverId,
                    actions: decoded.actions,
                    nonce: decoded.nonce,
                    maxBlockHeight: decoded.maxBlockHeight,
                    signerPublicKey: decoded.publicKey,
                    callbackUrl,
                    meta,
                    isPrebuilt: true,
                });
                return;
            }

            // Flow 2: Open-ended flow (receiverId + actions)
            const receiverId = query.receiverId;
            const actionsParam = query.actions;

            if (!receiverId || !actionsParam) {
                throw new Error(
                    'Missing required parameters: either delegateActionBase64 OR (receiverId + actions)'
                );
            }

            const actions = parseActionsFromQuery(actionsParam);
            validateDelegateActionParams({ receiverId, actions });

            setParams({
                receiverId,
                actions,
                callbackUrl,
                meta,
                isPrebuilt: false,
            });
        } catch (err) {
            console.error('Failed to parse sign-delegate-action params:', err);
            setParseError(err.message);
        }
    }, [location.search]);

    const isValidCallbackUrl = params?.callbackUrl
        ? isUrlNotJavascriptProtocol(params.callbackUrl)
        : false;

    const handleApprove = useCallback(async () => {
        if (!params || !accountId) {
            return;
        }

        setStatus(SIGN_STATUS.IN_PROGRESS);
        setError(null);

        Mixpanel.track('SIGN_DELEGATE_ACTION approve', { isPrebuilt: params.isPrebuilt });

        try {
            // Use appropriate signing function based on flow type
            const result = params.isPrebuilt
                ? await signPrebuiltDelegateAction({
                      accountId,
                      delegateActionBase64: params.delegateActionBase64,
                  })
                : await createSignedDelegateAction({
                      accountId,
                      receiverId: params.receiverId,
                      actions: params.actions,
                  });

            setStatus(SIGN_STATUS.SUCCESS);

            // Build callback URL with result
            const callbackParams = {
                accountId: result.accountId,
                publicKey: result.publicKey,
                signedDelegateAction: result.serialized,
            };

            const successUrl = addQueryParams(params.callbackUrl, callbackParams);

            // Handle popup window case
            if (window.opener) {
                setTimeout(() => {
                    dispatch(externalRedirectActions.showExternalRedirect(successUrl));
                }, 1500);
                return window.opener.postMessage(
                    {
                        status: 'success',
                        ...callbackParams,
                    },
                    convertUrlToSendMessage(params.callbackUrl)
                );
            }

            // Regular redirect
            dispatch(externalRedirectActions.showExternalRedirect(successUrl));
        } catch (err) {
            console.error('Failed to sign delegate action:', err);
            Mixpanel.track('SIGN_DELEGATE_ACTION error', { error: err.message });
            setError(err.message);
            setStatus(SIGN_STATUS.ERROR);
        }
    }, [params, accountId, dispatch]);

    // Reports a failure back to the requesting dapp, so it is never left waiting on a
    // callback that will not arrive.
    const rejectWith = useCallback(
        (errorParams) => {
            if (params?.callbackUrl && isValidCallbackUrl) {
                const errorUrl = addQueryParams(params.callbackUrl, errorParams);

                // Handle popup window case
                if (window.opener) {
                    setTimeout(() => {
                        dispatch(
                            externalRedirectActions.showExternalRedirect(errorUrl)
                        );
                    }, 1500);
                    return window.opener.postMessage(
                        {
                            status: 'failure',
                            ...errorParams,
                        },
                        convertUrlToSendMessage(params.callbackUrl)
                    );
                }

                dispatch(externalRedirectActions.showExternalRedirect(errorUrl));
            } else {
                dispatch(redirectTo('/'));
            }
        },
        [params, isValidCallbackUrl, dispatch]
    );

    const handleCancel = useCallback(() => {
        Mixpanel.track('SIGN_DELEGATE_ACTION reject');
        rejectWith({
            errorCode: 'userRejected',
            errorMessage: 'User rejected the delegate action request',
        });
    }, [rejectWith]);

    const handleUnsupportedSigner = useCallback(() => {
        rejectWith({
            errorCode: 'unsupportedSigner',
            errorMessage: 'Ledger is not supported yet for delegate actions',
        });
    }, [rejectWith]);

    // Show error if parsing failed or callback URL is invalid
    if (parseError || (params && !isValidCallbackUrl)) {
        return (
            <SignDelegateActionInvalid
                error={parseError || 'Invalid callback URL'}
                onClose={() => dispatch(redirectTo('/'))}
            />
        );
    }

    // Ledger is not supported yet for delegate actions: the NEP-366 payload cannot be
    // safely signed over the Ledger transaction instruction, so block it in the UI.
    if (isLedger) {
        return (
            <SignDelegateActionInvalid
                error={<Translate id='signDelegateAction.ledgerNotSupported' />}
                onClose={handleUnsupportedSigner}
            />
        );
    }

    // Show loading while parsing params
    if (!params) {
        return null;
    }

    return (
        <SignDelegateAction
            accountId={accountId}
            receiverId={params.receiverId}
            actions={params.actions}
            meta={params.meta}
            nonce={params.nonce}
            maxBlockHeight={params.maxBlockHeight}
            signerPublicKey={params.signerPublicKey}
            signing={status === SIGN_STATUS.IN_PROGRESS}
            error={error}
            onApprove={handleApprove}
            onCancel={handleCancel}
            disableApprove={!accountId}
        />
    );
};

export default SignDelegateActionWrapper;
