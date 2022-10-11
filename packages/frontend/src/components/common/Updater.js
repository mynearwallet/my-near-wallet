import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

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

    useEffect(() => {
        // Fetch values for the first time because "setInterval"
        // does not call it at the start
        dispatch(fetchTokenFiatValues());

        const intervalId = setInterval(
            () => dispatch(fetchTokenFiatValues()),
            THIRTY_SECONDS
        );

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    return null;
}
