import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import Modal from '../../common/modal/Modal';
import { selectSignSlice } from '../../../redux/slices/sign';
import Card from '../../common/styled/Card.css';
import LoadingDots from '../../common/loader/LoadingDots';
import { transactionToHistoryUIData } from '../../../redux/slices/transactionHistory/utils';
import { selectAccountId } from '../../../redux/slices/account';
import CONFIG from '../../../config';
import { Translate } from 'react-localize-redux';

const TransactionExecutorModal = () => {
    const signReducer = useSelector(selectSignSlice);
    const accountId = useSelector(selectAccountId);
    if (!signReducer.transactionsProgress.length) {
        return null;
    }
    return (
        // @ts-ignore
        <Modal id='transaction-executor-modal' disableClose onClose={() => {}}>
            <StyledContainer>
                <h4>
                    <Translate id='transaction.executeTitle' />
                </h4>
                <div className='card'>
                    {signReducer.transactionsProgress.map((tx, i) => {
                        const txUI = transactionToHistoryUIData(
                            {
                                ...tx,
                                transaction_outcome: {
                                    outcome: {
                                        status: {},
                                    },
                                },
                                receipts: [],
                                metaData: {},
                                status: {},
                            },
                            accountId,
                            CONFIG.CURRENT_NEAR_NETWORK
                        );
                        return (
                            <Card key={i}>
                                <div className='card-header'>
                                    <div className='card-title'>{txUI.title}</div>
                                    <div className='card-header__progress'>
                                        {(tx.txProgress === 'signing' ||
                                            !tx.txProgress) && <LoadingDots />}
                                        {tx.txProgress || 'pending'}
                                    </div>
                                </div>
                                <div className='card-footer'>
                                    {txUI.subtitle}
                                    <div className='card__step'>
                                        <Translate
                                            id='transaction.steps'
                                            data={{
                                                currentStepCount: i + 1 || 0,
                                                totalStepCount:
                                                    signReducer.transactionsProgress
                                                        .length || 0,
                                            }}
                                        />
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </StyledContainer>
        </Modal>
    );
};

export default TransactionExecutorModal;

const StyledContainer = styled.div`
    h4 {
        margin-bottom: 1em;
        text-align: center;
        font-size: 21px;
        font-weight: bold;
        color: #555;
    }
    .card {
        display: flex;
        flex-direction: column;
        gap: 0.8em;
    }
    .card-title {
        font-weight: bold;
    }
    .card-header {
        display: flex;
        justify-content: space-between;
    }
    .card-header__progress {
        display: flex;
        gap: 0.5em;
    }
    .card__step {
        font-weight: bold;
    }
    .card-footer {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
        word-break: break-word;
    }
`;
