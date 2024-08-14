import React, { useState } from 'react';
import { Translate } from 'react-localize-redux';
import BN from 'bn.js';
import { useDispatch, useSelector } from 'react-redux';
import { formatNearAmount, parseNearAmount } from 'near-api-js/lib/utils/format';
import { useMutation } from 'react-query';
import { useHistory } from 'react-router';

import FormButton from '../../common/FormButton';
import ArrowCircleIcon from '../../svg/ArrowCircleIcon';
import ValidatorBoxItem from '../components/ValidatorBoxItem';
import { Mixpanel } from '../../../mixpanel';
import AmountInput from '../components/AmountInput';
import { selectStakingSlice } from '../../../redux/slices/staking';
import {
    LIQUID_STAKING_MIN_AMOUNT,
    STAKING_AMOUNT_DEVIATION,
} from '../../../utils/staking';
import isDecimalString from '../../../utils/isDecimalString';
import { METAPOOL_CONTRACT_ID } from '../../../services/metapool/constant';
import { toYoctoNear } from '../../../utils/gasPrice';
import { selectAvailableBalance } from '../../../redux/slices/account';
import Container from '../../common/styled/Container.css';
import ledgerSlice from '../../../redux/slices/ledger';
import { getBalance } from '../../../redux/actions/account';
import { liquidStaking } from '../../../redux/actions/liquidStaking';

const StakingForm = () => {
    const history = useHistory();
    const dispatch = useDispatch();
    const [amount, setAmount] = useState('');
    const staking = useSelector(selectStakingSlice);
    const availableBalance = useSelector(selectAvailableBalance);
    const { currentAccount } = staking;

    const liquidStakingMutation = useMutation({
        mutationFn: async (amount: string) => {
            return await liquidStaking({
                contractId: METAPOOL_CONTRACT_ID,
                amountInYocto: new BN(toYoctoNear(amount)).toString(),
                accountId: currentAccount.accoundId,
            });
        },
        mutationKey: ['liquidStakingMutation', amount],
        onSuccess: () => {
            history.push('/staking');
        },
        onSettled: () => {
            dispatch(ledgerSlice.actions.hideLedgerModal());
            dispatch(getBalance());
        },
    });

    const handleSetMax = () => {
        const isPositiveValue = new BN(availableBalance).gt(new BN('0'));

        if (isPositiveValue) {
            setAmount(formatNearAmount(availableBalance, 5).replace(/,/g, ''));
        }
        Mixpanel.track('STAKE/UNSTAKE Use max token');
    };

    const handleOnChange = (amount) => {
        setAmount(amount);
    };

    const invalidStakeActionAmount =
        new BN(parseNearAmount(amount))
            .sub(new BN(availableBalance))
            .gt(new BN(STAKING_AMOUNT_DEVIATION)) ||
        new BN(parseNearAmount(amount)).lt(new BN(LIQUID_STAKING_MIN_AMOUNT)) ||
        !isDecimalString(amount);

    return (
        <Container className='small-centered'>
            <div className='send-theme'>
                <h1>
                    <Translate id={'staking.stake.title'} />
                </h1>
                <h2>
                    <Translate id={'staking.stake.desc'} />
                </h2>
                <div className='amount-header-wrapper'>
                    <h4>
                        <Translate id='staking.stake.amount' />
                    </h4>
                    <FormButton
                        className='small'
                        color='light-blue'
                        onClick={handleSetMax}
                        data-test-id='stakingPageUseMaxButton'
                    >
                        <Translate id='staking.stake.useMax' />
                    </FormButton>
                </div>
                <AmountInput
                    action={'stake'}
                    value={amount}
                    onChange={handleOnChange}
                    valid={!liquidStakingMutation.isLoading && !invalidStakeActionAmount}
                    availableBalance={availableBalance}
                    availableClick={handleSetMax}
                    insufficientBalance={!!amount && invalidStakeActionAmount}
                    disabled={false}
                    stakeFromAccount={true}
                    inputTestId='stakingAmountInput'
                    showSymbolNEAR={true}
                    symbol=''
                />
                {!!amount && amount < '1' && (
                    <div style={{ color: '#ff585d' }}>Minimum 1 NEAR</div>
                )}
                <ArrowCircleIcon color={'#6AD1E3'} />
                <div className='header-button'>
                    <h4>
                        <Translate id={'staking.stake.stakeWith'} />
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
                    sending={liquidStakingMutation.isLoading}
                    sendingString='staking.staking.checkingValidator'
                    disabled={!amount || amount < '1' || liquidStakingMutation.isLoading}
                    onClick={() => {
                        liquidStakingMutation.mutate(amount);
                    }}
                    trackingId='STAKE/UNSTAKE Click submit stake button'
                    data-test-id='submitStakeButton'
                >
                    <Translate id={'staking.stake.button'} />
                </FormButton>
            </div>
        </Container>
    );
};

export default StakingForm;
