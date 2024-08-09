import React, { useEffect, useState } from 'react';
import { useMutation } from 'react-query';
import { BN } from 'bn.js';
import styled from 'styled-components';
import { formatNearAmount, parseNearAmount } from 'near-api-js/lib/utils/format';
import { useDispatch } from 'react-redux';
import { Translate } from 'react-localize-redux';

import Modal from '../../common/modal/Modal';
import AmountInput from '../components/AmountInput';
import FormButton from '../../common/FormButton';
import { delayedUnstake, liquidUnStake } from '../../../redux/actions/staking';
import { METAPOOL_CONTRACT_ID } from '../../../services/metapool/constant';
import { toYoctoNear } from '../../../utils/gasPrice';
import FungibleTokens from '../../../services/FungibleTokens';
import useDebouncedValue from '../../../hooks/useDebouncedValue';
import { TStakedValidator } from './type';
import ledgerSlice from '../../../redux/slices/ledger';
import { getBalance } from '../../../redux/actions/account';
import classNames from '../../../utils/classNames';

type Props = {
    liquidValidatorData?: TStakedValidator;
    isModalVisible: boolean;
    setModalVisible: (p: React.SetStateAction<boolean>) => void;
    onUnstakeCompleted: () => void;
};

enum UnstakeType {
    'instant' = 'instant',
    'delayed' = 'delayed',
}

const ModalUnstake = ({
    liquidValidatorData,
    isModalVisible,
    setModalVisible,
    onUnstakeCompleted,
}: Props) => {
    const { stakedBalance } = liquidValidatorData || {};
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [minUnstakeOutput, setMinUnstakeOutput] = useState('');
    const [unstakeType, setUnstakeType] = useState(UnstakeType.instant);
    const dispatch = useDispatch();

    const liquidUnstakeMutation = useMutation({
        mutationFn: async (amount: string) => {
            return await liquidUnStake({
                contractId: METAPOOL_CONTRACT_ID,
                amountInYocto: new BN(toYoctoNear(amount)).toString(),
                minExpectInYocto: minUnstakeOutput,
            });
        },
        mutationKey: ['liquidUnstakeMutation'],
        onSuccess: () => {
            onUnstakeCompleted();
            setModalVisible(false);
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
                amountInYocto: new BN(toYoctoNear(amount)).toString(),
            });
        },
        mutationKey: ['delayedUnstakeMutation'],
        onSuccess: () => {
            onUnstakeCompleted();
            setModalVisible(false);
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

    const debouncedUnstakeAmount = useDebouncedValue(unstakeAmount, 500);
    useEffect(() => {
        if (debouncedUnstakeAmount) {
            stNearAmountMutation.mutate(debouncedUnstakeAmount);
        }
    }, [debouncedUnstakeAmount]);

    const insufficientBalance =
        unstakeAmount > formatNearAmount(stakedBalance) || unstakeAmount < '0';

    const isButtonDisabled =
        !unstakeAmount ||
        liquidUnstakeMutation.isLoading ||
        delayedUnstakeMutation.isLoading ||
        !unstakeType ||
        insufficientBalance;

    return (
        <Modal
            id='account-funded-modal'
            isOpen={isModalVisible}
            onClose={() => {
                setModalVisible((prev) => !prev);
            }}
            disableClose={liquidUnstakeMutation.isLoading}
            closeButton
            style={{ zIndex: 1000 }}
        >
            <Container>
                <div className='mb-2 title'>
                    <Translate id='staking.liquidStaking.unstakeToken' />
                </div>
                <AmountInput
                    action={'stake'}
                    value={unstakeAmount}
                    onChange={setUnstakeAmount}
                    valid={!unstakeAmount || !insufficientBalance}
                    availableBalance={stakedBalance}
                    // availableClick={handleSetMax}
                    insufficientBalance={insufficientBalance}
                    disabled={false}
                    stakeFromAccount={true}
                    inputTestId='stakingAmountInput'
                    showSymbolNEAR={false}
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
                <div className='mt-2 received'>
                    <div>
                        <Translate id='staking.liquidStaking.apy' />
                    </div>
                    <div>{liquidValidatorData.apy}%</div>
                </div>
                <div className='unstake-tab'>
                    <div
                        className={classNames([
                            'unstake-tab__item',
                            { active: unstakeType === UnstakeType.instant },
                        ])}
                        onClick={() => setUnstakeType(UnstakeType.instant)}
                    >
                        <div className='unstake-tab__title'>Instant Unstake</div>
                        <div className='unstake-tab__fee'>
                            Unstake fee: {liquidValidatorData.liquidUnstakeFee}%
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
                            Delayed Unstake In 2~6 days
                        </div>
                        <div className='unstake-tab__fee'>Unstake fee: 0</div>
                    </div>
                </div>
                <div className='button-container'>
                    <FormButton
                        className='button-unstake'
                        disabled={isButtonDisabled}
                        onClick={() => {
                            unstakeType === UnstakeType.instant
                                ? liquidUnstakeMutation.mutate(unstakeAmount)
                                : delayedUnstakeMutation.mutate(unstakeAmount);
                        }}
                    >
                        {unstakeType === UnstakeType.instant ? (
                            <Translate id='staking.liquidStaking.fastUnstake' />
                        ) : (
                            <Translate id='staking.liquidStaking.delayedUnstake' />
                        )}
                    </FormButton>
                </div>
            </Container>
        </Modal>
    );
};

export default ModalUnstake;

const Container = styled.div`
    .title {
        font-size: 20px;
        font-weight: bold;
        color: #444;
    }
    .near-amount:after {
        content: ' STNEAR';
    }
    .received {
        display: flex;
        justify-content: space-between;
    }
    .button-container {
        display: flex;
        gap: 10px;
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
    &&& {
        .button-unstake {
            height: 40px;
            padding: 0 2em;
        }
    }
`;
