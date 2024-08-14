// @ts-nocheck
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { useParams } from 'react-router';
import { useMutation, useQuery } from 'react-query';
import { Translate } from 'react-localize-redux';

import BalanceBox from '../components/BalanceBox';
import selectNEARAsTokenWithMetadata from '../../../redux/selectors/crossStateSelectors/selectNEARAsTokenWithMetadata';
import FormButton from '../../common/FormButton';
import Container from '../../common/styled/Container.css';
import { getMetapoolValidator } from './utils';
import { selectAccountId } from '../../../redux/slices/account';
import { NEAR_DECIMALS } from '../../../utils/constants';
import { FarmingAPY } from '../components/FarmingAPY';
import { liquidWithdrawAll } from '../../../redux/actions/liquidStaking';
import { redirectTo } from '../../../redux/actions/account';
import { Mixpanel } from '../../../mixpanel';
import StakeConfirmModal from '../components/StakeConfirmModal';

const ValidatorDetail = () => {
    const NEARAsTokenWithMetadata = useSelector(selectNEARAsTokenWithMetadata);
    const accountId = useSelector(selectAccountId);
    const params = useParams();
    const dispatch = useDispatch();
    const validatorId = params.validator;

    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const { data: liquidValidatorData, isLoading } = useQuery({
        queryKey: ['liquidValidator', accountId],
        queryFn: async () => {
            return getMetapoolValidator({
                accountId,
                tokens: [validatorId],
            });
        },
        enabled: !!accountId,
    });

    const withdrawAll = useMutation({
        mutationFn: async () => {
            return await liquidWithdrawAll({
                contractId: validatorId,
            });
        },
        mutationKey: ['liquidWithdrawAllMutation', accountId],
    });

    const tokenProps = {
        ...NEARAsTokenWithMetadata,
        onChainFTMetadata: {
            decimals: NEAR_DECIMALS,
            symbol: 'STNEAR',
        },
    };
    return (
        <StyledContainer className='small-centered'>
            <div className='validator-title'>
                Validator: <br />
                {validatorId}
            </div>
            <FormButton
                className='staking-button'
                trackingId='STAKE Click stake with validator button'
                linkTo={`/liquid-staking/${validatorId}/stake`}
                data-test-id='validatorPageStakeButton'
            >
                <Translate id='staking.validator.button' />
            </FormButton>
            <br />
            <br />
            <br />
            <FarmingAPY apy={liquidValidatorData?.apy} hideTooltip={true} />
            <BalanceBox
                title='staking.balanceBox.staked.title'
                info='staking.balanceBox.staked.info'
                token={{
                    ...tokenProps,
                    balance: liquidValidatorData?.stakedBalance,
                }}
                balanceTestId='stakingPagePendingReleaseAmount'
                loading={isLoading}
                button='staking.balanceBox.staked.button'
                buttonColor='gray-red'
                onClick={() => {
                    dispatch(redirectTo(`/liquid-staking/${validatorId}/unstake`));
                    Mixpanel.track('UNSTAKE Click unstake button');
                }}
            />
            <BalanceBox
                title='staking.balanceBox.pending.title'
                info='staking.balanceBox.pending.liquidInfo'
                token={{
                    ...tokenProps,
                    balance: !!liquidValidatorData?.unstakedStatus
                        ? '0'
                        : liquidValidatorData?.unstakedBalance,
                }}
                balanceTestId='stakingPagePendingReleaseAmount'
                disclaimer='staking.validator.liquidWithdrawalDisclaimer'
                loading={isLoading}
            />
            <BalanceBox
                title='staking.balanceBox.available.title'
                info='staking.balanceBox.available.info'
                token={{
                    ...tokenProps,
                    balance: !!liquidValidatorData?.unstakedStatus
                        ? liquidValidatorData?.unstakedBalance
                        : '0',
                }}
                buttonColor='gray-blue'
                loading={isLoading}
                button='staking.balanceBox.available.button'
                onClick={() => {
                    setShowConfirmModal(true);
                }}
            />
            {showConfirmModal && (
                <StakeConfirmModal
                    title='staking.validator.withdraw'
                    label='staking.stake.from'
                    validator={{ accountId: validatorId, active: true }}
                    amount={liquidValidatorData?.unstakedBalance}
                    open={showConfirmModal}
                    onConfirm={() => {
                        setShowConfirmModal(false);
                        withdrawAll.mutate();
                    }}
                    onClose={() => setShowConfirmModal(false)}
                    loading={isLoading}
                    sendingString='withdrawing'
                />
            )}
        </StyledContainer>
    );
};

export default ValidatorDetail;

const StyledContainer = styled(Container)`
    .validator-title {
        font-size: 30px;
        font-weight: bold;
        color: #000;
        text-align: center;
    }
    .withdrawal-disclaimer {
        margin-top: 1em;
    }
    .staking-button {
        width: 100%;
    }
`;
