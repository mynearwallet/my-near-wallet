import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import SwapPage from '../pages/tokenSwap';
import { selectAccountId } from '../redux/slices/account';
import { actions } from '../redux/slices/swap';

const { fetchData } = actions;

export default function SwapWrapper({ history }) {
    const dispatch = useDispatch();
    const accountId = useSelector(selectAccountId);

    useEffect(() => {
        if (accountId) {
            dispatch(fetchData({ accountId }));
        }
    }, [accountId]);

    return <SwapPage history={history} accountId={accountId} />;
}
