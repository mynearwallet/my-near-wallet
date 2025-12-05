/**
 * SignDelegateActionWrapper - Route handler for NEP-366 meta-transaction signing
 *
 * This component handles the /sign-delegate-action route, enabling gasless transactions
 * where users sign a DelegateAction that can be submitted by a relayer.
 *
 * URL Parameters:
 * - receiverId: The contract to call
 * - actions: JSON array of actions to execute
 * - callbackUrl: URL to redirect after signing
 * - meta: Optional metadata (e.g., referrer info)
 *
 * @see https://github.com/near/NEPs/pull/366
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { parse as parseQueryString } from 'query-string';

import SignDelegateAction from '../components/sign-delegate-action/SignDelegateAction';
import SignDelegateActionInvalid from '../components/sign-delegate-action/SignDelegateActionInvalid';
import { Mixpanel } from '../mixpanel';
import { redirectTo } from '../redux/actions/account';
import { selectAccountId } from '../redux/slices/account';
import { addQueryParams } from '../utils/buildUrl';
import { isUrlNotJavascriptProtocol } from '../utils/helper-api';
import convertUrlToSendMessage from '../utils/convertUrlToSendMessage';
import {
    createSignedDelegateAction,
    parseActionsFromQuery,
    validateDelegateActionParams,
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

    // Parse URL parameters on mount
    useEffect(() => {
        try {
            const query = parseQueryString(location.search);

            const receiverId = query.receiverId;
            const actionsParam = query.actions;
            const callbackUrl = query.callbackUrl;
            const meta = query.meta ? JSON.parse(query.meta) : null;

            if (!receiverId || !actionsParam || !callbackUrl) {
                throw new Error(
                    'Missing required parameters: receiverId, actions, callbackUrl'
                );
            }

            const actions = parseActionsFromQuery(actionsParam);
            validateDelegateActionParams({ receiverId, actions });

            setParams({
                receiverId,
                actions,
                callbackUrl,
                meta,
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

        Mixpanel.track('SIGN_DELEGATE_ACTION approve');

        try {
            const result = await createSignedDelegateAction({
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

            // Handle popup window case
            if (window.opener) {
                setTimeout(() => {
                    window.location.href = addQueryParams(
                        params.callbackUrl,
                        callbackParams
                    );
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
            window.location.href = addQueryParams(params.callbackUrl, callbackParams);
        } catch (err) {
            console.error('Failed to sign delegate action:', err);
            Mixpanel.track('SIGN_DELEGATE_ACTION error', { error: err.message });
            setError(err.message);
            setStatus(SIGN_STATUS.ERROR);
        }
    }, [params, accountId]);

    const handleCancel = useCallback(() => {
        Mixpanel.track('SIGN_DELEGATE_ACTION reject');

        const errorParams = {
            errorCode: 'userRejected',
            errorMessage: 'User rejected the delegate action request',
        };

        if (params?.callbackUrl && isValidCallbackUrl) {
            // Handle popup window case
            if (window.opener) {
                setTimeout(() => {
                    window.location.href = addQueryParams(
                        params.callbackUrl,
                        errorParams
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

            window.location.href = addQueryParams(params.callbackUrl, errorParams);
        } else {
            dispatch(redirectTo('/'));
        }
    }, [params, isValidCallbackUrl, dispatch]);

    // Show error if parsing failed or callback URL is invalid
    if (parseError || (params && !isValidCallbackUrl)) {
        return (
            <SignDelegateActionInvalid
                error={parseError || 'Invalid callback URL'}
                onClose={() => dispatch(redirectTo('/'))}
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
            signing={status === SIGN_STATUS.IN_PROGRESS}
            error={error}
            onApprove={handleApprove}
            onCancel={handleCancel}
            disableApprove={!accountId}
        />
    );
};

export default SignDelegateActionWrapper;
