import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AuthorizedAppsKeys from './AuthorizedAppsKeys';
import FullAccessKeys from './FullAccessKeys';
import { getAccessKeys, removeAccessKey } from '../../../redux/actions/account';
import {
    selectAccountSlice,
    selectAccountFullAccessKeys,
} from '../../../redux/slices/account';

export default ({ type }) => {
    const dispatch = useDispatch();

    const [deAuthorizingKey, setDeAuthorizingKey] = useState('');

    const account = useSelector(selectAccountSlice);

    // TODO: Use selectors once PR is merged to master:
    // https://github.com/near/near-wallet/pull/2178
    const fullAccessKeys = useSelector(selectAccountFullAccessKeys);
    const authorizedAppsKeys = account.authorizedApps;

    const deAuthorizeKey = async (publicKey) => {
        setDeAuthorizingKey(publicKey);
        try {
            await dispatch(removeAccessKey(publicKey));
            await dispatch(getAccessKeys());
        } finally {
            setDeAuthorizingKey('');
        }
    };

    if (type === 'authorized-apps') {
        return (
            <AuthorizedAppsKeys
                authorizedAppsKeys={authorizedAppsKeys}
                onClickDeAuthorizeKey={(publicKey) => deAuthorizeKey(publicKey)}
                deAuthorizingKey={deAuthorizingKey}
            />
        );
    }

    if (type === 'full-access-keys') {
        return (
            <FullAccessKeys
                fullAccessKeys={fullAccessKeys}
                accountId={account.accountId}
            />
        );
    }
};
