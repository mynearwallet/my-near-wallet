import React, { FC, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { switchAccount } from '../../redux/actions/account';
import { selectAccountSlice } from '../../redux/slices/account';
import {
    selectFlowLimitationMainMenu,
    selectFlowLimitationSubMenu,
} from '../../redux/slices/flowLimitation';
import Navigation from './Navigation';

const NavigationWrapper: FC = () => {
    const dispatch = useDispatch();
    const account = useSelector(selectAccountSlice);
    const flowLimitationMainMenu = useSelector(selectFlowLimitationMainMenu);
    const flowLimitationSubMenu = useSelector(selectFlowLimitationSubMenu);

    const selectAccount = useCallback((accountId) => {
        dispatch(switchAccount(accountId));
    }, []);

    return (
        <Navigation
            selectAccount={selectAccount}
            flowLimitationMainMenu={flowLimitationMainMenu}
            flowLimitationSubMenu={flowLimitationSubMenu}
            currentAccount={account}
        />
    );
};

export default NavigationWrapper;
