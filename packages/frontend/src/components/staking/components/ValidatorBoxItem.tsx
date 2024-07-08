import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';
import { useHistory } from 'react-router';

import UserIcon from '../../svg/UserIcon';
import FormButton from '../../common/FormButton';
import Balance from '../../common/balance/Balance';

type Props = {
    validatorId: string;
    fee: string;
    active?: boolean;
    isSelectable?: boolean;
    amount?: string;
    withCta?: boolean;
    handleUnstake?: () => void;
    onClick?: () => void;
};

const Container = styled.div`
    display: flex;
    .left {
        margin-left: 10px;
    }

    .active {
        color: #00c08b;
    }

    .inactive {
        color: #ff585d;
    }

    .validator-select-button {
        width: auto !important;
        margin: 0 !important;
        margin-left: auto !important;
        padding: 0px 10px !important;
        height: 34px !important;
    }

    .validator-box {
        cursor: pointer;
    }
`;

const ValidatorBoxItem = ({
    validatorId,
    fee,
    active,
    isSelectable,
    amount,
    withCta,
    handleUnstake,
    onClick,
}: Props) => {
    const history = useHistory();
    return (
        <div onClick={onClick}>
            <Container className='validator-box' data-test-id='stakingPageValidatorItem'>
                <UserIcon background={true} />
                <div className='left'>
                    <div>
                        <div
                            className='name-container'
                            data-test-id='stakingPageValidatorItemName'
                        >
                            {validatorId}
                        </div>
                    </div>
                    {!!fee && (
                        <div className='text-left'>
                            <span>
                                {fee}% <Translate id='staking.validatorBox.fee' /> -&nbsp;
                            </span>
                            <span>
                                {' '}
                                {active ? (
                                    <span className='active'>
                                        <Translate id='staking.validatorBox.state.active' />
                                    </span>
                                ) : (
                                    <span className='inactive'>
                                        <Translate id='staking.validatorBox.state.inactive' />
                                    </span>
                                )}
                            </span>
                        </div>
                    )}
                </div>
                {isSelectable && (
                    // @ts-ignore
                    <FormButton
                        className='validator-select-button gray-blue'
                        linkTo={`/liquid-staking/${validatorId}`}
                        data-test-id='stakingPageSelectValidator'
                    >
                        <Translate id='staking.validatorBox.cta' />
                    </FormButton>
                )}
                {!!amount && (
                    <div className='amount'>
                        <Balance amount={amount} showBalanceInUSD />
                    </div>
                )}
            </Container>
            {withCta && (
                <div>
                    {/* @ts-ignore */}
                    <FormButton onClick={handleUnstake}>Unstake</FormButton>
                    {/* @ts-ignore */}
                    <FormButton
                        onClick={() => {
                            history.push(`/liquid-staking/${validatorId}/stake`);
                        }}
                    >
                        Stake More
                    </FormButton>
                </div>
            )}
        </div>
    );
};

export default ValidatorBoxItem;
