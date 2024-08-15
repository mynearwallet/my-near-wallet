import React, { useEffect, useState } from 'react';
import { Translate } from 'react-localize-redux';
import BN from 'bn.js';
import { useDispatch, useSelector } from 'react-redux';
import { formatNearAmount, parseNearAmount } from 'near-api-js/lib/utils/format';
import { useMutation, useQuery } from 'react-query';
import styled from 'styled-components';

import FormButton from '../../common/FormButton';
import ArrowCircleIcon from '../../svg/ArrowCircleIcon';
import ValidatorBoxItem from '../components/ValidatorBoxItem';
import AmountInput from '../components/AmountInput';
import { METAPOOL_CONTRACT_ID } from '../../../services/metapool/constant';
import { toYoctoNear } from '../../../utils/gasPrice';
import { selectAccountId } from '../../../redux/slices/account';
import Container from '../../common/styled/Container.css';
import ledgerSlice from '../../../redux/slices/ledger';
import { getBalance } from '../../../redux/actions/account';
import { delayedUnstake, liquidUnStake } from '../../../redux/actions/liquidStaking';
import FungibleTokens from '../../../services/FungibleTokens';
import useDebouncedValue from '../../../hooks/useDebouncedValue';
import classNames from '../../../utils/classNames';
import { getMetapoolValidator } from './utils';
import SuccessAction from './SuccessAction';
import { getCachedContractMetadataOrFetch } from '../../../redux/slices/tokensMetadata';
import { selectTokensFiatValueUSD } from '../../../redux/slices/tokenFiatValues';

enum UnstakeType {
    'instant' = 'instant',
    'delayed' = 'delayed',
}

const validatorId = METAPOOL_CONTRACT_ID;

const UnstakeForm = () => {
    const dispatch = useDispatch();
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [minUnstakeOutput, setMinUnstakeOutput] = useState('');
    const [unstakeType, setUnstakeType] = useState(UnstakeType.instant);
    const accountId = useSelector(selectAccountId);

    const liquidUnstakeMutation = useMutation({
        mutationFn: async (amount: string) => {
            return await liquidUnStake({
                contractId: validatorId,
                amountInYocto: new BN(toYoctoNear(amount)).toString(),
                minExpectInYocto: minUnstakeOutput,
            });
        },
        mutationKey: ['liquidUnstakeMutation'],
        onSuccess: () => {
            setIsSuccess(true);
        },
        onSettled: () => {
            dispatch(ledgerSlice.actions.hideLedgerModal());
            dispatch(getBalance());
        },
    });

    const delayedUnstakeMutation = useMutation({
        mutationFn: async (amount: string) => {
            return await delayedUnstake({
                contractId: METAPOOL_CONTRACT_ID,
                amountInYocto: amount,
            });
        },
        mutationKey: ['delayedUnstakeMutation'],
        onSuccess: () => {
            setIsSuccess(true);
        },
        onSettled: () => {
            dispatch(ledgerSlice.actions.hideLedgerModal());
            dispatch(getBalance());
        },
    });

    const stNearAmountMutation = useMutation({
        mutationFn: async (stNear: string) => {
            const stNearYocto = parseNearAmount(stNear);
            return FungibleTokens.viewFunctionAccount.viewFunction(
                METAPOOL_CONTRACT_ID,
                'get_near_amount_sell_stnear',
                { stnear_to_sell: stNearYocto }
            );
        },
        mutationKey: ['stNearAmountMutation'],
        onSuccess: (res) => {
            setMinUnstakeOutput(res);
        },
    });

    const { data: liquidValidatorData } = useQuery({
        queryKey: ['liquidValidator', accountId],
        queryFn: async () => {
            return getMetapoolValidator({
                accountId,
                tokens: [METAPOOL_CONTRACT_ID],
            });
        },
        enabled: !!accountId,
    });

    const { data: liquidStakingMetadata } = useQuery({
        queryKey: ['liquidStakingMetadata', accountId, validatorId],
        queryFn: async () => {
            return getCachedContractMetadataOrFetch(validatorId, {});
        },
    });

    const { stakedBalance } = liquidValidatorData || {};

    const debouncedUnstakeAmount = useDebouncedValue(unstakeAmount, 500);
    useEffect(() => {
        if (debouncedUnstakeAmount) {
            stNearAmountMutation.mutate(debouncedUnstakeAmount);
        }
    }, [debouncedUnstakeAmount]);

    const insufficientBalance =
        unstakeAmount > formatNearAmount(stakedBalance) || unstakeAmount < '0';
    const fungibleTokenPrices = useSelector(selectTokensFiatValueUSD);

    if (isSuccess) {
        const updatedAmount = (
            +stakedBalance - +parseNearAmount(unstakeAmount)
        ).toString();
        return (
            <SuccessAction
                action='liquidUnstake'
                accountId={accountId}
                stakedAmountYocto={updatedAmount}
                unstakedAmount={unstakeAmount}
                token={{
                    balance: updatedAmount || '',
                    contractName: validatorId,
                    onChainFTMetadata: liquidStakingMetadata || {},
                    fiatValueMetadata: {
                        usd: fungibleTokenPrices[validatorId]?.usd,
                    },
                }}
            />
        );
    }

    return (
        <StyledContainer className='small-centered'>
            <div className='send-theme'>
                <h1>
                    <Translate id={'staking.unstake.title'} />
                </h1>
                <h2>
                    <Translate id={'staking.unstake.desc'} />
                </h2>
                <AmountInput
                    action={'unstake'}
                    value={unstakeAmount}
                    onChange={setUnstakeAmount}
                    valid={!unstakeAmount || !insufficientBalance}
                    availableBalance={stakedBalance}
                    insufficientBalance={insufficientBalance}
                    disabled={false}
                    stakeFromAccount={true}
                    inputTestId='stakingAmountInput'
                    showSymbolNEAR={false}
                    symbol='STNEAR'
                />
                <div className='mt-2 received'>
                    <div>
                        <Translate id='staking.liquidStaking.estimatedReceived' />
                    </div>
                    {(!!minUnstakeOutput && !!unstakeAmount && (
                        <div>~{formatNearAmount(minUnstakeOutput, 5)} NEAR</div>
                    )) ||
                        '-'}
                </div>
                <div className='unstake-tab'>
                    <div
                        className={classNames([
                            'unstake-tab__item',
                            { active: unstakeType === UnstakeType.instant },
                        ])}
                        onClick={() => setUnstakeType(UnstakeType.instant)}
                    >
                        <div className='unstake-tab__title'>
                            <Translate id='staking.liquidStaking.instantUnstake' />
                        </div>
                        <div className='unstake-tab__fee'>
                            <Translate
                                id='staking.liquidStaking.unstakeFee'
                                data={{
                                    amount: liquidValidatorData?.liquidUnstakeFee,
                                }}
                            />
                        </div>
                    </div>
                    <div
                        className={classNames([
                            'unstake-tab__item',
                            { active: unstakeType === UnstakeType.delayed },
                        ])}
                        onClick={() => setUnstakeType(UnstakeType.delayed)}
                    >
                        <div className='unstake-tab__title'>
                            <Translate
                                id='staking.liquidStaking.delayedUnstakeFeeTitle'
                                data={{
                                    amount: liquidValidatorData?.liquidUnstakeFee,
                                }}
                            />
                        </div>
                        <div className='unstake-tab__fee'>
                            <Translate
                                id='staking.liquidStaking.unstakeFee'
                                data={{
                                    amount: 0,
                                }}
                            />
                        </div>
                    </div>
                </div>
                <ArrowCircleIcon color={'#6AD1E3'} />
                <div className='header-button'>
                    <h4>
                        <Translate id={'staking.unstake.stakeWith'} />
                    </h4>
                    <FormButton
                        className='small'
                        color='light-blue'
                        linkTo='/staking/validators'
                        trackingId='STAKE Go to validators list page'
                    >
                        <Translate id='button.edit' />
                    </FormButton>
                </div>
                <ValidatorBoxItem validatorId={METAPOOL_CONTRACT_ID} active />
                <FormButton
                    sending={liquidUnstakeMutation.isLoading}
                    sendingString='staking.staking.checkingValidator'
                    disabled={
                        insufficientBalance ||
                        liquidUnstakeMutation.isLoading ||
                        delayedUnstakeMutation.isLoading ||
                        !unstakeAmount
                    }
                    onClick={() => {
                        unstakeType === UnstakeType.instant
                            ? liquidUnstakeMutation.mutate(unstakeAmount)
                            : delayedUnstakeMutation.mutate(minUnstakeOutput);
                    }}
                    trackingId='STAKE/UNSTAKE Click submit stake button'
                    data-test-id='submitStakeButton'
                >
                    {unstakeType === UnstakeType.instant ? (
                        <Translate id='staking.liquidStaking.fastUnstake' />
                    ) : (
                        <Translate id='staking.liquidStaking.delayedUnstake' />
                    )}
                </FormButton>
            </div>
        </StyledContainer>
    );
};

export default UnstakeForm;

const StyledContainer = styled(Container)`
    .received {
        display: flex;
        justify-content: space-between;
        margin-bottom: 2em;
    }
    .unstake-tab {
        display: flex;
        gap: 1em;
        margin-top: 0.8em;
    }
    .unstake-tab__item {
        border: 1px solid #bbbbbb;
        border-radius: 6px;
        padding: 0.8em 1.3em;
        width: 50%;
        cursor: pointer;
    }
    .unstake-tab__item.active {
        border: 1px solid #148402;
        color: #148402;
    }
`;
