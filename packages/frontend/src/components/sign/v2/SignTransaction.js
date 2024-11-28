import BN from 'bn.js';
import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import Balance from '../../common/balance/Balance';
import Tooltip from '../../common/Tooltip';
import TransactionInterpretationItem from './TransactionInterpretationItem';

const StyledContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

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

        .right {
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

        &.from {
            .near-amount {
                color: #72727a;
            }

            &.no-border {
                border-top: none;
            }
        }

        &.fees {
            .left {
                display: flex;
                align-items: center;
            }
            .near-amount {
                color: #3f4045;
            }
            .fiat-amount {
                color: #a2a2a8;
                font-size: 14px;
                margin-top: 5px;
            }
        }

        &.shard {
            background-color: #f9f1fd;
            padding-top: 32px;
            padding-bottom: 32px;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;

            .left {
                display: flex;
                align-items: center;
            }
            .right {
                font-weight: 600;
                word-break: break-all;
                color: #272729;
            }
        }
    }
    .tx-card {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        width: 100%;
    }
    .tx-card__icon {
        align-self: center;
        display: flex;
        margin-right: 0.7em;
        max-width: 34px;
    }
    .tx-card__content {
        width: 70%;
        flex-grow: 1;
    }
    .tx-card__subtitle {
        font-size: 12px;
    }
    .tx-card__right {
        flex-grow: 1;
        text-align: right;
    }
    .tx-card__right__title {
        font-weight: bold;
        text-wrap: nowrap;
    }
`;

export default ({
    transferAmount,
    sender,
    estimatedFees,
    availableBalance,
    fromLabelId,
    privateShardInfo,
    transactions,
}) => {
    const isTransferTransaction = new BN(transferAmount).gt(new BN(0));
    return (
        <StyledContainer className='transfer-amount brs-8 bsw-l'>
            {privateShardInfo && (
                <div className='account shard'>
                    <div className='left'>
                        <Translate id='transfer.privateShard' />
                        <Tooltip translate='transfer.tooltip' />
                    </div>
                    <div className='right'>{privateShardInfo.shardId}</div>
                </div>
            )}
            {isTransferTransaction && (
                <Balance
                    amount={transferAmount}
                    showGenericSymbol={!!privateShardInfo}
                    showBalanceInUSD={!privateShardInfo}
                />
            )}
            {transactions.map((transaction, i) => {
                return (
                    <TransactionInterpretationItem key={i} transaction={transaction} />
                );
            })}
            <div className={'account'}>
                <Translate id={fromLabelId || 'transfer.from'} />
                <div className='right'>
                    <div className='account-id'>{sender}</div>
                    {!privateShardInfo && (
                        <Balance amount={availableBalance} showBalanceInUSD={false} />
                    )}
                </div>
            </div>
            <div className='account fees'>
                <div className='left'>
                    <Translate id='transfer.estimatedFees' />
                    <Tooltip translate='sendV2.translateIdInfoTooltip.estimatedFees' />
                </div>
                <div className='right'>
                    <Balance
                        amount={privateShardInfo ? 0 : estimatedFees}
                        showBalanceInNEAR={!privateShardInfo}
                    />
                </div>
            </div>
        </StyledContainer>
    );
};
