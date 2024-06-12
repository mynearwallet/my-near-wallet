import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Translate } from 'react-localize-redux';

import Modal from '../../common/modal/Modal';
import { selectSignSlice } from '../../../redux/slices/sign';
import Card from '../../common/styled/Card.css';
import LoadingDots from '../../common/loader/LoadingDots';
import { transactionToHistoryUIData } from '../../../redux/slices/transactionHistory/utils';
import { selectAccountId } from '../../../redux/slices/account';
import CONFIG from '../../../config';
import {
    TX_PROGRESS,
    transactionsProgress,
} from '../../../redux/slices/sign/transactionExecutor';
import FormButton from '../../common/FormButton';

const TransactionExecutorModal = () => {
    const signReducer = useSelector(selectSignSlice);
    const accountId = useSelector(selectAccountId);
    const dispatch = useDispatch();
    if (
        !signReducer.transactionsProgress.length ||
        signReducer.transactionsProgress.every(
            (item) => item.txProgress === TX_PROGRESS.success
        )
    ) {
        return null;
    }
    const hasError = signReducer.transactionsProgress.some(
        (item) => item.txProgress === TX_PROGRESS.failed
    );

    return (
        // @ts-ignore
        <Modal
            id='transaction-executor-modal'
            closeButton={hasError}
            disableClose={!hasError}
            onClose={() => {
                dispatch(
                    transactionsProgress({
                        txs: [],
                    })
                );
            }}
        >
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
                            <StyledCard key={i} txProgress={tx.txProgress}>
                                <div className='card-header'>
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
                                    <div className='card-header__progress'>
                                        {(tx.txProgress === 'signing' ||
                                            !tx.txProgress) && <LoadingDots />}
                                        {tx.txProgress || 'pending'}
                                    </div>
                                </div>
                                <div className='card-content'>
                                    <div>
                                        <div className='card-title'>{txUI.title}</div>
                                        <div>{txUI.subtitle}</div>
                                    </div>
                                </div>
                                {!!txUI.transactionHash && (
                                    <div className='card-footer'>
                                        <div className='hash'>
                                            Transaction hash: {txUI.transactionHash}
                                        </div>
                                        {/* @ts-ignore */}
                                        <FormButton
                                            color='gray'
                                            className='link'
                                            linkTo={`${CONFIG.EXPLORER_URL}/txns/${txUI.transactionHash}`}
                                        >
                                            View on explorer
                                        </FormButton>
                                    </div>
                                )}
                            </StyledCard>
                        );
                    })}
                </div>
            </StyledContainer>
        </Modal>
    );
};

export default TransactionExecutorModal;

const StyledCard = styled(Card)<{ txProgress: string }>`
    ${({ txProgress }) => {
        if (txProgress === TX_PROGRESS.success) {
            return `
                border-color: #b9f4b9;
                background-color: #e8ffe8;
            `;
        } else if (txProgress === TX_PROGRESS.failed) {
            return `
                border-color: #f38e8e;
                background-color: #ffdfdf;
            `;
        }
    }};
`;

const StyledContainer = styled.div`
    width: 100%;
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
        margin-bottom: 1em;
    }
    .card-header__progress {
        display: flex;
        gap: 0.5em;
        text-transform: capitalize;
    }
    .card__step {
        font-weight: bold;
        border: 1px solid #a3a3a3;
        border-radius: 4px;
        padding: 1px 5px;
        font-size: 12px;
    }
    .card-content {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
        word-break: break-word;
    }
    .card-footer {
        font-size: 12px;
        margin-top: 1em;
    }
    .hash {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
    }
    .link {
        text-decoration: underline;
    }
`;
