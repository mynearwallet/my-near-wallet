import BN from 'bn.js';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import SignTransferAccountNotFound from '../components/sign/SignTransferAccountNotFound';
import SignTransferInvalid from '../components/sign/SignTransferInvalid';
import SignTransferMultipleAccounts from '../components/sign/SignTransferMultipleAccounts';
import SignTransferRetry from '../components/sign/SignTransferRetry';
import SignTransactionDetailsWrapper from '../components/sign/v2/SignTransactionDetailsWrapper';
import SignTransactionSummaryWrapper from '../components/sign/v2/SignTransactionSummaryWrapper';
import { Mixpanel } from '../mixpanel';
import { switchAccount, redirectTo } from '../redux/actions/account';
import { selectAccountId, selectAccountUrlPrivateShard } from '../redux/slices/account';
import {
    selectAvailableAccounts,
    selectAvailableAccountsIsLoading,
} from '../redux/slices/availableAccounts';
import {
    handleSignTransactions,
    selectSignFeesGasLimitIncludingGasChanges,
    SIGN_STATUS,
    selectSignStatus,
    selectSignCallbackUrl,
    selectSignMeta,
    selectSignErrorName,
    selectSignErrorMessage,
    selectSignTransactionHashes,
    selectSignTransactions,
    selectSignTransactionsBatchIsValid,
} from '../redux/slices/sign';
import { addQueryParams } from '../utils/buildUrl';
import { isUrlNotJavascriptProtocol } from '../utils/helper-api';
import convertUrlToSendMessage from '../utils/convertUrlToSendMessage';

const SignWrapper = () => {
    const dispatch = useDispatch();

    const DISPLAY = {
        TRANSACTION_SUMMARY: 0,
        TRANSACTION_DETAILS: 1,
        INSUFFICIENT_NETWORK_FEE: 2,
        ACCOUNT_NOT_FOUND: 3,
        MULTIPLE_ACCOUNTS_IN_BATCH: 4,
    };

    const [currentDisplay, setCurrentDisplay] = useState(DISPLAY.TRANSACTION_SUMMARY);

    const signFeesGasLimitIncludingGasChanges = useSelector(
        selectSignFeesGasLimitIncludingGasChanges
    );
    const signStatus = useSelector(selectSignStatus);
    const signCallbackUrl = useSelector(selectSignCallbackUrl);
    const signMeta = useSelector(selectSignMeta);
    const signErrorName = useSelector(selectSignErrorName);
    const signErrorMessage = useSelector(selectSignErrorMessage);
    const transactionHashes = useSelector(selectSignTransactionHashes);
    const availableAccounts = useSelector(selectAvailableAccounts);
    const availableAccountsIsLoading = useSelector(selectAvailableAccountsIsLoading);
    const transactions = useSelector(selectSignTransactions);
    const accountId = useSelector(selectAccountId);
    const transactionBatchisValid = useSelector(selectSignTransactionsBatchIsValid);
    const privateShardInfo = useSelector(selectAccountUrlPrivateShard);

    const isValidCallbackUrl = isUrlNotJavascriptProtocol(signCallbackUrl);
    const signerId = transactions.length && transactions[0].signerId;
    const signGasFee = new BN(signFeesGasLimitIncludingGasChanges)
        .div(new BN('1000000000000'))
        .toString();
    const submittingTransaction = signStatus === SIGN_STATUS.IN_PROGRESS;
    const isSignerValid = accountId === signerId;

    useEffect(() => {
        if (!transactionBatchisValid) {
            setCurrentDisplay(DISPLAY.MULTIPLE_ACCOUNTS_IN_BATCH);
        } else if (
            signerId &&
            !availableAccountsIsLoading &&
            !availableAccounts.some((accountId) => accountId === signerId)
        ) {
            setCurrentDisplay(DISPLAY.ACCOUNT_NOT_FOUND);
        } else {
            setCurrentDisplay(DISPLAY.TRANSACTION_SUMMARY);
        }
    }, [
        signerId,
        transactionBatchisValid,
        availableAccounts,
        accountId,
        availableAccountsIsLoading,
    ]);

    useEffect(() => {
        if (
            !isSignerValid &&
            availableAccounts.some((accountId) => accountId === signerId)
        ) {
            dispatch(switchAccount({ accountId: signerId }));
        }
    }, [signerId, availableAccounts, accountId]);

    useEffect(() => {
        if (signStatus === SIGN_STATUS.RETRY_TRANSACTION) {
            setCurrentDisplay(DISPLAY.INSUFFICIENT_NETWORK_FEE);
        }

        if (signStatus === SIGN_STATUS.SUCCESS) {
            if (signCallbackUrl && !!transactionHashes.length && isValidCallbackUrl) {
                if (window.opener) {
                    setTimeout(() => {
                        window.location.href = addQueryParams(signCallbackUrl, {
                            signMeta,
                            transactionHashes: transactionHashes.join(','),
                        });
                    }, 3000);
                    return window.opener.postMessage(
                        {
                            status: 'success',
                            signMeta,
                            transactionHashes: transactionHashes.join(','),
                        },
                        convertUrlToSendMessage(signCallbackUrl)
                    );
                }
                window.location.href = addQueryParams(signCallbackUrl, {
                    signMeta,
                    transactionHashes: transactionHashes.join(','),
                });
            } else {
                dispatch(redirectTo('/'));
            }
        }
    }, [signStatus]);

    const handleApproveTransaction = async () => {
        Mixpanel.track('SIGN approve the transaction');
        await dispatch(handleSignTransactions());
    };

    const cancelTransactionRedirect = () => {
        if (privateShardInfo) {
            const encounter = addQueryParams(signCallbackUrl, {
                signMeta,
                errorCode: encodeURIComponent('userRejected'),
                errorMessage: encodeURIComponent('User rejected transaction'),
            });
            window.location.href = encounter;
            return;
        }

        Mixpanel.track('SIGN Deny the transaction');

        if (signCallbackUrl && isValidCallbackUrl) {
            if (signStatus !== SIGN_STATUS.ERROR) {
                window.location.href = addQueryParams(signCallbackUrl, {
                    signMeta,
                    errorCode: encodeURIComponent('userRejected'),
                    errorMessage: encodeURIComponent('User rejected transaction'),
                });
            } else {
                window.location.href = addQueryParams(signCallbackUrl, {
                    signMeta,
                    errorCode:
                        encodeURIComponent(signErrorName) ||
                        encodeURIComponent('unknownError'),
                    errorMessage:
                        encodeURIComponent(signErrorMessage.substring(0, 100)) ||
                        encodeURIComponent('Unknown error'),
                });
            }
        } else {
            dispatch(redirectTo('/'));
        }
    };

    const handleCancelTransaction = async () => {
        if (window.opener) {
            setTimeout(() => {
                cancelTransactionRedirect();
            }, 3000);
            return window.opener.postMessage(
                {
                    status: 'failure',
                    signMeta,
                    errorCode:
                        signStatus !== SIGN_STATUS.ERROR
                            ? 'userRejected'
                            : signErrorName || 'unknownError',
                    errorMessage:
                        signStatus !== SIGN_STATUS.ERROR
                            ? 'User rejected transaction'
                            : signErrorMessage.substring(0, 100) || 'Unknown error',
                },
                convertUrlToSendMessage(signCallbackUrl)
            );
        }

        cancelTransactionRedirect();
    };

    // potentially malicious callback URL found
    if (!isValidCallbackUrl) {
        return <SignTransferInvalid />;
    }

    if (currentDisplay === DISPLAY.INSUFFICIENT_NETWORK_FEE) {
        return (
            <SignTransferRetry
                handleRetry={handleApproveTransaction}
                handleCancel={handleCancelTransaction}
                gasLimit={signGasFee}
                submittingTransaction={submittingTransaction}
            />
        );
    }

    if (currentDisplay === DISPLAY.ACCOUNT_NOT_FOUND) {
        return (
            <SignTransferAccountNotFound
                handleCancel={handleCancelTransaction}
                signCallbackUrl={signCallbackUrl}
                signTransactionSignerId={signerId}
                submittingTransaction={submittingTransaction}
            />
        );
    }

    if (currentDisplay === DISPLAY.MULTIPLE_ACCOUNTS_IN_BATCH) {
        return (
            <SignTransferMultipleAccounts
                handleCancel={handleCancelTransaction}
                signCallbackUrl={signCallbackUrl}
                signTransactionSignerId={signerId}
                submittingTransaction={submittingTransaction}
            />
        );
    }

    if (currentDisplay === DISPLAY.TRANSACTION_DETAILS) {
        return (
            <SignTransactionDetailsWrapper
                onClickGoBack={() => setCurrentDisplay(DISPLAY.TRANSACTION_SUMMARY)}
                signGasFee={signGasFee}
            />
        );
    }

    return (
        <SignTransactionSummaryWrapper
            onClickCancel={handleCancelTransaction}
            onClickApprove={handleApproveTransaction}
            submittingTransaction={submittingTransaction}
            signGasFee={signGasFee}
            onClickMoreInformation={() => setCurrentDisplay(DISPLAY.TRANSACTION_DETAILS)}
            onClickEditAccount={() => setCurrentDisplay(DISPLAY.ACCOUNT_SELECTION)}
            isSignerValid={isSignerValid}
            isValidCallbackUrl={isValidCallbackUrl}
            privateShardInfo={privateShardInfo}
        />
    );
};

export default SignWrapper;
