import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import ConfirmLogin from './ConfirmLogin';
import { Mixpanel } from '../../../mixpanel/index';
import { allowLogin } from '../../../redux/actions/account';
import {
    selectAccountLocalStorageAccountId,
    selectAccountUrlPrivateShard,
    selectAccountUrlReferrer,
} from '../../../redux/slices/account';
import { isUrlNotJavascriptProtocol } from '../../../utils/helper-api';

export default ({
    loginAccessType,
    contractId,
    contractIdUrl,
    onClickCancel,
    publicKey,
    successUrl,
}) => {
    const dispatch = useDispatch();

    const accountLocalStorageAccountId = useSelector(selectAccountLocalStorageAccountId);
    const accountUrlReferrer = useSelector(selectAccountUrlReferrer);
    const successUrlIsValid = isUrlNotJavascriptProtocol(successUrl);
    const privateShardInfo = useSelector(selectAccountUrlPrivateShard);

    return (
        <ConfirmLogin
            signedInAccountId={accountLocalStorageAccountId}
            loginAccessType={loginAccessType}
            appReferrer={accountUrlReferrer}
            publicKey={publicKey}
            contractId={contractId}
            onClickCancel={onClickCancel}
            onClickConnect={() => {
                dispatch(allowLogin());
                return Mixpanel.withTracking('LOGIN', () => {});
            }}
            contractIdUrl={contractIdUrl}
            successUrlIsValid={successUrlIsValid}
            privateShardInfo={privateShardInfo}
        />
    );
};
