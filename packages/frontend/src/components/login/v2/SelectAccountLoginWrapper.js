import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import SelectAccountLogin from './SelectAccountLogin';
import { Mixpanel } from '../../../mixpanel/index';
import {
    switchAccount,
    getAccountBalance,
    redirectTo,
    redirectToApp,
} from '../../../redux/actions/account';
import {
    selectAccountLocalStorageAccountId,
    selectAccountUrlReferrer,
    selectAccountAccountsBalances,
    selectAccountExists,
    selectAccountUrlPrivateShard,
} from '../../../redux/slices/account';
import { selectAvailableAccounts } from '../../../redux/slices/availableAccounts';
import { isUrlNotJavascriptProtocol } from '../../../utils/helper-api';
import convertUrlToSendMessage from '../../../utils/convertUrlToSendMessage';

export default ({
    loginAccessType,
    contractId,
    contractIdUrl,
    onClickNext,
    failureUrl,
    successUrl,
}) => {
    const dispatch = useDispatch();

    const accountLocalStorageAccountId = useSelector(selectAccountLocalStorageAccountId);
    const availableAccounts = useSelector(selectAvailableAccounts);
    const accountAccountsBalances = useSelector(selectAccountAccountsBalances);
    const accountUrlReferrer = useSelector(selectAccountUrlReferrer);
    const failureAndSuccessUrlsAreValid =
        isUrlNotJavascriptProtocol(failureUrl) && isUrlNotJavascriptProtocol(successUrl);
    const accountExists = useSelector(selectAccountExists);
    const privateShardInfo = useSelector(selectAccountUrlPrivateShard);

    return (
        <SelectAccountLogin
            signedInAccountId={accountLocalStorageAccountId}
            availableAccounts={availableAccounts}
            accountsBalances={accountAccountsBalances}
            onSelectAccount={(accountId) => dispatch(switchAccount({ accountId }))}
            getAccountBalance={(accountId) => dispatch(getAccountBalance(accountId))}
            onSignInToDifferentAccount={() => {
                Mixpanel.track('LOGIN Click recover different account button');
                dispatch(redirectTo('/recover-account'));
            }}
            loginAccessType={loginAccessType}
            appReferrer={accountUrlReferrer}
            contractId={contractId}
            contractIdUrl={contractIdUrl}
            onClickCancel={() => {
                Mixpanel.track('LOGIN Click deny button');
                if (failureUrl && failureAndSuccessUrlsAreValid) {
                    if (window.opener) {
                        return window.opener.postMessage(
                            {
                                status: 'failure',
                                errorCode: 'USER_CANCELLED',
                                errorMessage: 'User cancelled the Action',
                            },
                            convertUrlToSendMessage(failureUrl)
                        );
                    }
                    window.location.href = failureUrl;
                } else {
                    dispatch(redirectToApp());
                }
            }}
            onClickNext={onClickNext}
            failureAndSuccessUrlsAreValid={failureAndSuccessUrlsAreValid}
            accountExists={accountExists}
            privateShardInfo={privateShardInfo}
        />
    );
};
