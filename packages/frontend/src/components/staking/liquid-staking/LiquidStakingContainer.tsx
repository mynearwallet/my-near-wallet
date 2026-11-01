import React, { memo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { Route, Switch } from 'react-router-dom';
import { useHistory } from 'react-router';

import { selectAccountId } from '../../../redux/slices/account';
import StakingForm from './StakingForm';
import { getBalance } from '../../../redux/actions/account';
import ValidatorDetail from './ValidatorDetail';
import UnstakeForm from './UnstakeForm';
import { isSunsetCapabilityEnabled } from '../../../config/sunset';
import FeatureRetiredPage from '../../sunset/FeatureRetiredPage';

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
                    path='/liquid-staking/:validatorId'
                    render={(props) => <ValidatorDetail {...props} />}
                />
                <Route
                    exact
                    path='/liquid-staking/:validatorId/stake'
                    render={(props) =>
                        isSunsetCapabilityEnabled('stakeDeposit') ? (
                            <StakingForm {...props} />
                        ) : (
                            <FeatureRetiredPage
                                capability='stakeDeposit'
                                route='/liquid-staking/:validatorId/stake'
                            />
                        )
                    }
                />
                <Route
                    exact
                    path='/liquid-staking/:validatorId/unstake'
                    render={(props) =>
                        isSunsetCapabilityEnabled('stakeManage') ? (
                            <UnstakeForm {...props} />
                        ) : (
                            <FeatureRetiredPage
                                capability='stakeManage'
                                route='/liquid-staking/:validatorId/unstake'
                            />
                        )
                    }
                />
            </Switch>
        </ConnectedRouter>
    );
};

export default memo(LiquidStakingContainer);
