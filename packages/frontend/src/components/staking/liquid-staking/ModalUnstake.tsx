import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { BN } from 'bn.js';

import Modal from '../../common/modal/Modal';
import AmountInput from '../components/AmountInput';
import FormButton from '../../common/FormButton';
import { liquidUnStake } from '../../../redux/actions/staking';
import { METAPOOL_CONTRACT_ID } from '../../../services/metapool/constant';
import { toYoctoNear } from '../../../utils/gasPrice';

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
    return (
        // @ts-ignore
        <Modal
            id='account-funded-modal'
            isOpen={isModalVisible}
            onClose={() => {
                setModalVisible((prev) => !prev);
            }}
            disableClose={liquidUnstakeMutation.isLoading}
        >
            <div className='mb-2' style={{ fontSize: '18px' }}>
                Unstake Token
            </div>
            {/* @ts-ignore */}
            <AmountInput
                action={'stake'}
                value={unstakeAmount}
                onChange={setUnstakeAmount}
                valid={true}
                availableBalance={stakedBalance}
                // availableClick={handleSetMax}
                // insufficientBalance={invalidStakeActionAmount}
                disabled={false}
                stakeFromAccount={true}
                inputTestId='stakingAmountInput'
            />
            {/* @ts-ignore */}
            <FormButton
                className='small'
                disabled={!unstakeAmount || liquidUnstakeMutation.isLoading}
                onClick={() => {
                    liquidUnstakeMutation.mutate(unstakeAmount);
                }}
            >
                Unstake
            </FormButton>
        </Modal>
    );
};

export default ModalUnstake;
