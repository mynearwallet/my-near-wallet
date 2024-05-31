import React from 'react';
import { useSelector } from 'react-redux';

import Modal from '../../common/modal/Modal';
import { selectSignSlice } from '../../../redux/slices/sign';
import styled from 'styled-components';
import Card from '../../common/styled/Card.css';
import LoadingDots from '../../common/loader/LoadingDots';
// import { transactionToHistoryUIData } from '../../../redux/slices/transactionHistory/utils';

const TransactionExecutorModal = () => {
    const signReducer = useSelector(selectSignSlice);
    // if (!signReducer.transactionsProgress.length) {
    //     return null;
    // }
    const txs = [
        {
            receiverId: 'wrap.testnet',
            actions: [
                {
                    functionCall: {
                        methodName: 'near_deposit',
                        args: { type: 'Buffer', data: [123, 125] },
                        gas: '30000000000000',
                        deposit: '10000000000000000000000',
                    },
                    enum: 'functionCall',
                },
            ],
            txProgress: 'success',
        },
        {
            receiverId: 'wrap.testnet',
            actions: [
                {
                    functionCall: {
                        methodName: 'ft_transfer_call',
                        args: {
                            type: 'Buffer',
                            data: [
                                123, 34, 114, 101, 99, 101, 105, 118, 101, 114, 95, 105,
                                100, 34, 58, 34, 114, 101, 102, 45, 102, 105, 110, 97,
                                110, 99, 101, 45, 49, 48, 49, 46, 116, 101, 115, 116, 110,
                                101, 116, 34, 44, 34, 97, 109, 111, 117, 110, 116, 34, 58,
                                34, 49, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48,
                                48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 34, 44, 34, 109,
                                115, 103, 34, 58, 34, 123, 92, 34, 97, 99, 116, 105, 111,
                                110, 115, 92, 34, 58, 91, 123, 92, 34, 112, 111, 111, 108,
                                95, 105, 100, 92, 34, 58, 51, 52, 44, 92, 34, 116, 111,
                                107, 101, 110, 95, 105, 110, 92, 34, 58, 92, 34, 119, 114,
                                97, 112, 46, 116, 101, 115, 116, 110, 101, 116, 92, 34,
                                44, 92, 34, 116, 111, 107, 101, 110, 95, 111, 117, 116,
                                92, 34, 58, 92, 34, 117, 115, 100, 116, 46, 102, 97, 107,
                                101, 115, 46, 116, 101, 115, 116, 110, 101, 116, 92, 34,
                                44, 92, 34, 97, 109, 111, 117, 110, 116, 95, 105, 110, 92,
                                34, 58, 92, 34, 49, 48, 48, 48, 48, 48, 48, 48, 48, 48,
                                48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 92,
                                34, 44, 92, 34, 109, 105, 110, 95, 97, 109, 111, 117, 110,
                                116, 95, 111, 117, 116, 92, 34, 58, 92, 34, 51, 56, 57,
                                49, 56, 51, 48, 52, 49, 55, 57, 53, 92, 34, 125, 93, 125,
                                34, 125,
                            ],
                        },
                        gas: '180000000000000',
                        deposit: '1',
                    },
                    enum: 'functionCall',
                },
            ],
        },
    ];
    // console.log(JSON.stringify(signReducer.transactionsProgress));
    return (
        // @ts-ignore
        <Modal
            id='transaction-executor-modal'
            // closeButton='desktop'
            // isOpen={
            //     !!signReducer.transactionsProgress.length &&
            //     signReducer.transactionsProgress.some((tx) => tx.txProgress === 'signing')
            // }
            disableClose
            onClose={() => {}}
        >
            <StyledContainer>
                <h4>Executing Transaction</h4>
                <div className='card'>
                    {txs.map((tx, i) => {
                        // const action = tx.actions[0];
                        // const txUI = transactionToHistoryUIData(
                        //     {
                        //         transaction: {
                        //             ...tx,
                        //             receiver_id: tx.receiverId,
                        //         },
                        //         transaction_outcome: {
                        //             outcome: {
                        //                 status: {},
                        //             },
                        //         },
                        //         receipts: [],
                        //         metaData: {},
                        //         status: {},
                        //     },
                        //     '',
                        //     'mainnet'
                        // );
                        // console.log({ txUI });
                        return (
                            <Card key={i}>
                                <div className='card-header'>
                                    <div className='card-title'>
                                        -{/* {txUI.title} */}
                                    </div>
                                    <div className='card-header__progress'>
                                        {(tx.txProgress === 'signing' ||
                                            !tx.txProgress) && <LoadingDots />}
                                        {tx.txProgress || 'pending'}
                                    </div>
                                </div>
                                <div className='card-footer'>
                                    Calling {tx.actions[0].functionCall.methodName} with{' '}
                                    {tx.receiverId}
                                    <div className='card__step'>
                                        Step {i + 1} of{' '}
                                        {signReducer.transactionsProgress.length}
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
