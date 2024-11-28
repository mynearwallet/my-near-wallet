import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import useInterval from '../../hooks/useInterval';
import { selectAccountId } from '../../redux/slices/account';
import { actions as tokenFiatValuesActions } from '../../redux/slices/tokenFiatValues';
import { actions as tokensActions } from '../../redux/slices/tokens';

const { fetchTokenFiatValues } = tokenFiatValuesActions;
const { fetchTokens } = tokensActions;

const THIRTY_SECONDS = 30_000;

export default function Updater() {
    const dispatch = useDispatch();
    const accountId = useSelector(selectAccountId);

    useEffect(() => {
        if (accountId) {
            dispatch(fetchTokens({ accountId }));
        }
    }, [accountId]);

    useInterval(() => {
        dispatch(fetchTokenFiatValues());
    }, THIRTY_SECONDS);

    return null;
}
