import React, { memo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { Route, Switch } from 'react-router-dom';
import { useHistory } from 'react-router';

import { selectAccountId } from '../../../redux/slices/account';
import StakingForm from './StakingForm';
import { getBalance } from '../../../redux/actions/account';
import OwnedValidators from './OwnedValidators';

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
                <Route
                    exact
                    path='/liquid-staking'
                    render={() => (
                        <>
                            <div>Liquid Staking</div>
                            <div>Create New Staking</div>
                            <div>My Staked Validators</div>
                            <div>
                                It may take ~1 minute to display your newly staked
                                validator.
                            </div>
                            <div>Metapool</div>
                            <OwnedValidators accountId={accountId} />
                        </>
                    )}
                />
            </Switch>
        </ConnectedRouter>
    );
};

export default memo(LiquidStakingContainer);
