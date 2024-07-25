import React, { useEffect, useState } from 'react';
import { useMutation } from 'react-query';
import { BN } from 'bn.js';
import styled from 'styled-components';
import { formatNearAmount, parseNearAmount } from 'near-api-js/lib/utils/format';

import Modal from '../../common/modal/Modal';
import AmountInput from '../components/AmountInput';
import FormButton from '../../common/FormButton';
import { delayedUnstake, liquidUnStake } from '../../../redux/actions/staking';
import { METAPOOL_CONTRACT_ID } from '../../../services/metapool/constant';
import { toYoctoNear } from '../../../utils/gasPrice';
import FungibleTokens from '../../../services/FungibleTokens';
import useDebouncedValue from '../../../hooks/useDebouncedValue';
import { TStakedValidator } from './type';

type Props = {
    liquidValidatorData?: TStakedValidator;
    isModalVisible: boolean;
    setModalVisible: (p: React.SetStateAction<boolean>) => void;
    onUnstakeCompleted: () => void;
};

const ModalUnstake = ({
    liquidValidatorData,
    isModalVisible,
    setModalVisible,
    onUnstakeCompleted,
}: Props) => {
    const { stakedBalance } = liquidValidatorData || {};
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [minUnstakeOutput, setMinUnstakeOutput] = useState('');

    const liquidUnstakeMutation = useMutation({
        mutationFn: async (amount: string) => {
            return await liquidUnStake({
                contractId: METAPOOL_CONTRACT_ID,
                amountInYocto: new BN(toYoctoNear(amount)).toString(),
                minAmountInYocto: minUnstakeOutput,
            });
        },
        mutationKey: ['liquidUnstakeMutation'],
        onSuccess: () => {
            onUnstakeCompleted();
            setModalVisible(false);
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
        delayedUnstakeMutation.isLoading;

    return (
        <Modal
            id='account-funded-modal'
            isOpen={isModalVisible}
            onClose={() => {
                setModalVisible((prev) => !prev);
            }}
            disableClose={liquidUnstakeMutation.isLoading}
            closeButton
        >
            <Container>
                <div className='mb-2 title'>Unstake Token</div>
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
                    <div>Estimated received</div>
                    {(!!minUnstakeOutput && !!unstakeAmount && (
                        <div>~{formatNearAmount(minUnstakeOutput, 5)} NEAR</div>
                    )) ||
                        '-'}
                </div>
                <div className='mt-2 received'>
                    <div>APY</div>
                    <div>{liquidValidatorData.apy}%</div>
                </div>
                <div className='mt-2 received'>
                    <div>Liquid Unstake Fee</div>
                    <div>{liquidValidatorData.liquidUnstakeFee}%</div>
                </div>
                <div className='mt-2 received'>
                    <div>Delayed Unstake Unlock Period</div>
                    <div>2 ~ 6 days</div>
                </div>
                <div className='button-container'>
                    <FormButton
                        className='small px-2'
                        disabled={isButtonDisabled}
                        onClick={() => {
                            liquidUnstakeMutation.mutate(unstakeAmount);
                        }}
                    >
                        Fast Unstake
                    </FormButton>
                    <FormButton
                        className='small px-2'
                        disabled={isButtonDisabled}
                        onClick={() => {
                            delayedUnstakeMutation.mutate(unstakeAmount);
                        }}
                    >
                        Delayed Unstake
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
    &&& {
        .small {
            width: 170px;
        }
    }
`;
