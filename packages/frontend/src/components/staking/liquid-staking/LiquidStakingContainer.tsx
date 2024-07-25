import React, { memo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { Route, Switch } from 'react-router-dom';
import { useHistory } from 'react-router';

import { selectAccountId } from '../../../redux/slices/account';
import StakingForm from './StakingForm';
import { getBalance } from '../../../redux/actions/account';

const LiquidStakingContainer = () => {
    const accountId = useSelector(selectAccountId);
    const history = useHistory();

    const dispatch = useDispatch();
    useEffect(() => {
        if (accountId) {
            dispatch(getBalance('', true));
        }
    }, [accountId]);

    return (
        <ConnectedRouter history={history}>
            <Switch>
                <Route
                    exact
                    path='/liquid-staking/:validator/stake'
                    render={(props) => <StakingForm {...props} />}
                />
            </Switch>
        </ConnectedRouter>
    );
};

export default memo(LiquidStakingContainer);
