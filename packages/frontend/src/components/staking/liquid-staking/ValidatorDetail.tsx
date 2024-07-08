// @ts-nocheck
import React from 'react';
import BN from 'bn.js';
import { useSelector } from 'react-redux';

import { METAPOOL_CONTRACT_ID } from '../../../services/metapool/constant';
import BalanceBox from '../components/BalanceBox';
import selectNEARAsTokenWithMetadata from '../../../redux/selectors/crossStateSelectors/selectNEARAsTokenWithMetadata';
import FormButton from '../../common/FormButton';

const ValidatorDetail = () => {
    const NEARAsTokenWithMetadata = useSelector(selectNEARAsTokenWithMetadata);
    const totalAvailable = 0;
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
            <FormButton linkTo={`/liquid-staking/${METAPOOL_CONTRACT_ID}/stake`}>
                metapool staking
            </FormButton>
        </div>
    );
};

export default ValidatorDetail;
