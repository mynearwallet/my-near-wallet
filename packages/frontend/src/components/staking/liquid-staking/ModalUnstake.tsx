import React, { useEffect, useState } from 'react';
import { useMutation } from 'react-query';
import { BN } from 'bn.js';
import styled from 'styled-components';
import { formatNearAmount, parseNearAmount } from 'near-api-js/lib/utils/format';

import Modal from '../../common/modal/Modal';
import AmountInput from '../components/AmountInput';
import FormButton from '../../common/FormButton';
import { liquidUnStake } from '../../../redux/actions/staking';
import { METAPOOL_CONTRACT_ID } from '../../../services/metapool/constant';
import { toYoctoNear } from '../../../utils/gasPrice';
import FungibleTokens from '../../../services/FungibleTokens';
import useDebouncedValue from '../../../hooks/useDebouncedValue';

type Props = {
    stakedBalance: string;
    isModalVisible: boolean;
    setModalVisible: (p: React.SetStateAction<boolean>) => void;
    onUnstakeCompleted: () => void;
};

const ModalUnstake = ({
    stakedBalance,
    isModalVisible,
    setModalVisible,
    onUnstakeCompleted,
}: Props) => {
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [resultAmount, setResultAmount] = useState('');

    const liquidUnstakeMutation = useMutation({
        mutationFn: async (amount: string) => {
            return await liquidUnStake({
                contractId: METAPOOL_CONTRACT_ID,
                amountInYocto: new BN(toYoctoNear(amount)).toString(),
            });
        },
        mutationKey: ['liquidUnstakeMutation'],
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
            setResultAmount(formatNearAmount(res, 5));
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
                    {!!resultAmount && !!unstakeAmount && <div>~{resultAmount} NEAR</div>}
                </div>
                <FormButton
                    className='small'
                    disabled={!unstakeAmount || liquidUnstakeMutation.isLoading}
                    onClick={() => {
                        liquidUnstakeMutation.mutate(unstakeAmount);
                    }}
                >
                    Unstake
                </FormButton>
            </Container>
        </Modal>
    );
};

export default ModalUnstake;

const Container = styled.div`
    .title {
        font-size: 18px;
    }
    .near-amount:after {
        content: ' STNEAR';
    }
    .received {
        display: flex;
        justify-content: space-between;
    }
`;
