import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';
import { useHistory } from 'react-router';

import UserIcon from '../../svg/UserIcon';
import FormButton from '../../common/FormButton';

type Props = {
    validatorId: string;
    fee?: string;
    active?: boolean;
    isSelectable?: boolean;
    amountString?: string;
    withCta?: boolean;
    info?: React.ReactNode;
    linkTo?: string;
    handleUnstake?: () => void;
    onClick?: () => void;
};

const buttonStyle = {
    width: 'auto',
    margin: 0,
    padding: '0 14px',
    fontWeight: 400,
    height: '30px',
};

const ValidatorBoxItem = ({
    validatorId,
    fee,
    active,
    isSelectable,
    amountString,
    withCta,
    info,
    linkTo,
    handleUnstake,
    onClick,
}: Props) => {
    const history = useHistory();
    return (
        <Container onClick={onClick}>
            <div className='validator-box' data-test-id='stakingPageValidatorItem'>
                <div className='content'>
                    <UserIcon background={true} />
                    <div>
                        <div
                            className='name-container'
                            data-test-id='stakingPageValidatorItemName'
                        >
                            <a href={linkTo} target='_blank' rel='noreferrer'>
                                {validatorId}
                            </a>
                        </div>
                        <div className='text-left'>
                            {!!fee && (
                                <span className='fee'>
                                    {fee}% <Translate id='staking.validatorBox.fee' />{' '}
                                    -&nbsp;
                                </span>
                            )}
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
                    </div>
                </div>
                {isSelectable && (
                    // @ts-ignore
                    <FormButton
                        className='validator-select-button gray-blue'
                        linkTo={`/liquid-staking/${validatorId}/stake`}
                        data-test-id='stakingPageSelectValidator'
                    >
                        <Translate id='staking.validatorBox.cta' />
                    </FormButton>
                )}
                {!!amountString && (
                    <div className='amount-wrapper'>
                        <div className='active'>Staking</div>
                        <div className='amount'>{amountString}</div>
                    </div>
                )}
            </div>
            {info}
            {withCta && (
                <CtaWrapper>
                    <FormButton
                        color='gray-gray'
                        style={buttonStyle}
                        onClick={handleUnstake}
                    >
                        Unstake
                    </FormButton>
                    <FormButton
                        style={buttonStyle}
                        onClick={() => {
                            history.push(`/liquid-staking/${validatorId}/stake`);
                        }}
                    >
                        Stake More
                    </FormButton>
                </CtaWrapper>
            )}
        </Container>
    );
};

export default ValidatorBoxItem;

const Container = styled.div`
    border-top: 2px solid #f2f2f2;
    padding: 1em 0;
    .validator-box {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: #24272a;
    }
    svg {
        margin-right: 10px;
    }
    .content {
        display: flex;
        justify-content: space-around;
        align-items: center;
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

    .fee {
        color: #a7a29e;
    }

    .amount-wrapper {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        text-align: right;
    }
    .badge {
        border: 1px solid #444;
    }
    a {
        color: #444;
    }
`;

const CtaWrapper = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 0.6em;
    justify-content: flex-end;
    && {
        button {
            margin: 6px auto 0 auto !important;
        }
    }
`;
