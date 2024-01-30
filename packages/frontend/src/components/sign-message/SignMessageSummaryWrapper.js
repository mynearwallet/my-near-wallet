import React from 'react';
import { useSelector } from 'react-redux';

import SignMessageSummary from './SignMessageSummary';
import {
    selectAccountUrlReferrer,
    selectAccountLocalStorageAccountId,
    selectAccountId,
} from '../../redux/slices/account';

export default ({
    message,
    onClickCancel,
    onClickApprove,
    signing,
    isValidCallbackUrl,
    isValidNonce,
}) => {
    const accountLocalStorageAccountId = useSelector(selectAccountLocalStorageAccountId);
    const accountUrlReferrer = useSelector(selectAccountUrlReferrer);
    const accountId = useSelector(selectAccountId);
    const disableApprove = !accountId;

    return (
        <SignMessageSummary
            accountId={accountLocalStorageAccountId}
            onClickCancel={onClickCancel}
            onClickApprove={onClickApprove}
            accountUrlReferrer={accountUrlReferrer}
            message={message}
            signing={signing}
            isValidCallbackUrl={isValidCallbackUrl}
            isValidNonce={isValidNonce}
            disableApprove={disableApprove}
        />
    );
};
