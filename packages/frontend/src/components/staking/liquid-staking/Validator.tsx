// @ts-nocheck
import React from 'react';
import BN from 'bn.js';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router';

import { METAPOOL_CONTRACT_ID } from '../../../services/metapool/constant';
import BalanceBox from '../components/BalanceBox';
import selectNEARAsTokenWithMetadata from '../../../redux/selectors/crossStateSelectors/selectNEARAsTokenWithMetadata';
import FormButton from '../../common/FormButton';

const Validator = () => {
    const NEARAsTokenWithMetadata = useSelector(selectNEARAsTokenWithMetadata);
    const totalAvailable = 0;
    const match = useRouteMatch();
    console.log({ match });
    // const stakeFromAccount = currentAccount.accountId === accountId;
    return (
        <div>
            Validator
            <BalanceBox
                title='staking.balanceBox.pending.title'
                info='staking.balanceBox.pending.info'
                token={{ ...NEARAsTokenWithMetadata, balance: 0 }}
                balanceTestId='stakingPagePendingReleaseAmount'
            />
            <BalanceBox
                title='staking.balanceBox.available.title'
                info='staking.balanceBox.available.info'
                token={{ ...NEARAsTokenWithMetadata, balance: totalAvailable }}
                button={
                    new BN(totalAvailable).isZero()
                        ? null
                        : 'staking.balanceBox.available.button'
                }
                // linkTo={`/staking/${selectedValidator}`}
                buttonColor='gray-blue'
            />
            <FormButton linkTo={`/liquid-staking/${METAPOOL_CONTRACT_ID}`}>
                metapool staking
            </FormButton>
        </div>
    );
};

export default Validator;
