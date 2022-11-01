import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { switchAccount, getAccountBalance } from '../../redux/actions/account';
import { selectAccountSlice } from '../../redux/slices/account';
import { selectAvailableAccounts } from '../../redux/slices/availableAccounts';
// import { selectFlowLimitationMainMenu, selectFlowLimitationSubMenu } from '../../redux/slices/flowLimitation';
import Navigation from './NewNavigation';

export default () => {
    const dispatch = useDispatch();

    const account = useSelector(selectAccountSlice);
    // const flowLimitationMainMenu = useSelector(selectFlowLimitationMainMenu);
    // const flowLimitationSubMenu = useSelector(selectFlowLimitationSubMenu);
    const availableAccounts = useSelector(selectAvailableAccounts);

    const selectAccount = useCallback((accountId) => {
        dispatch(switchAccount({ accountId }));
    }, []);

    const refreshBalance = useCallback((accountId) => {
        dispatch(getAccountBalance(accountId));
    }, []);

    return (
        <Navigation
            selectAccount={selectAccount}
            // flowLimitationMainMenu={flowLimitationMainMenu}
            // flowLimitationSubMenu={flowLimitationSubMenu}
            accounts={availableAccounts}
            currentAccount={account}
            refreshBalance={refreshBalance}
        />
    );
};
