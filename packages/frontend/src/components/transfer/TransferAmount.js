import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import ArrowTransferIcon from './ArrowTransferIcon';
import Balance from '../common/balance/Balance';

const StyledContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    > svg {
        margin-top: 30px;
    }

    > .balance {
        text-align: center;
        margin: 30px 0;
        .near-amount {
            font-size: 31px;
            font-weight: 600;
            color: #272729;
        }
        .fiat-amount {
            color: #72727a;
            font-size: 16px;
        }
    }

    > .account {
        width: 100%;
        border-top: 1px solid #f0f0f1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px;
        color: #72727a;

        > div {
            text-align: right;
            margin-left: 20px;

            .account-id {
                color: #272729;
                font-weight: 600;
                word-break: break-all;
            }

            .balance {
                color: #a2a2a8;
                margin-top: 5px;
            }
        }
    }
`;

export default ({ transferAmount, sender, receiver, receiverBalance }) => {
    return (
        <StyledContainer className='transfer-amount brs-8 bsw-l'>
            <ArrowTransferIcon />
            <Balance amount={transferAmount} />
            <div className='account'>
                <Translate id='transfer.from' />
                <div>
                    <div className='account-id'>{sender}</div>
                    <Balance amount={transferAmount} showBalanceInUSD={false} />
                </div>
            </div>
            <div className='account'>
                <Translate id='transfer.to' />
                <div>
                    <div className='account-id'>{receiver}</div>
                    <Balance amount={receiverBalance} showBalanceInUSD={false} />
                </div>
            </div>
        </StyledContainer>
    );
};
