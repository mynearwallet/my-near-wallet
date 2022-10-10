import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { selectAccountId } from '../../redux/slices/account';
import { actions as tokensActions } from '../../redux/slices/tokens';

const { fetchTokens } = tokensActions;

export default function Bootstrap() {
    const dispatch = useDispatch();
    const accountId = useSelector(selectAccountId);

    useEffect(() => {
        if (accountId) {
            dispatch(fetchTokens({ accountId }));
        }
    }, [accountId]);

    return null;
}
