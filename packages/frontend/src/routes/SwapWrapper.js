import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import SwapPage from '../pages/tokenSwap';
import { selectAccountId } from '../redux/slices/account';
import { actions } from '../redux/slices/swap';

const { fetchPools } = actions;

export default function SwapWrapper() {
    const dispatch = useDispatch();
    const accountId = useSelector(selectAccountId);

    useEffect(() => {
        if (accountId) {
            dispatch(fetchPools({ accountId }));
        }
    }, [accountId]);

    return <SwapPage accountId={accountId} />;
}
