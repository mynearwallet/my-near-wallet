import dayjs from 'dayjs';
import React from 'react';
import { Translate } from 'react-localize-redux';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { ETxDirection } from './TransactionItem';
import CONFIG from '../../config';
import { selectAccountId } from '../../redux/slices/account';
import {
    transactionHistoryActions,
    transactionHistorySelector,
} from '../../redux/slices/transactionHistory';
import {
    getPrefixByDir,
    transPico2Date,
    transactionToHistoryUIData,
} from '../../redux/slices/transactionHistory/utils';
import classNames from '../../utils/classNames';
import FormButton from '../common/FormButton';
import Modal from '../common/modal/Modal';
import ImageWithLoading from '../common/image/ImageWithLoading';

const TransactionItemModal = () => {
    const dispatch = useDispatch();
    const { selectedTx, transactions } = useSelector(transactionHistorySelector);
    const accountId = useSelector(selectAccountId);
    function onClose() {
        dispatch(transactionHistoryActions.setSelectedTx(''));
    }
    if (!selectedTx) {
        return null;
    }
    const transaction = transactions.find((t) => t.transaction.hash === selectedTx);
    const tx = transactionToHistoryUIData(transaction, accountId, CONFIG.NETWORK_ID);
    return (
        <Modal id='transaction-modal' isOpen={!!selectedTx} onClose={onClose} closeButton>
            <StyledContainer>
                <div className='row'>
                    <div className='item head-item'>
                        <div className='icon'>
                            <ImageWithLoading
                                src={tx.image}
                                alt='transaction-icon'
                                loadImageTimeout={60_000}
                                style={{ objectFit: 'contain' }}
                            />
                        </div>
                        <div>
                            <h2>{tx.title}</h2>
                            <div className='subtitle'>{tx.subtitle}</div>
                        </div>
                    </div>
                    {!!tx.assetChangeText && (
                        <div className='item'>
                            <span>Amount</span>
                            <div>
                                {!!tx.assetChangeText && (
                                    <span
                                        className={classNames([
                                            'desc',
                                            {
                                                'text-green':
                                                    tx.dir !== ETxDirection.send,
                                            },
                                        ])}
                                    >
                                        {getPrefixByDir(tx.dir)}
                                        {tx.assetChangeText}
                                    </span>
                                )}
                                {!!tx.assetChangeText2 && (
                                    <span className='desc'>-{tx.assetChangeText2}</span>
                                )}
                            </div>
                        </div>
                    )}
                    <div className='item'>
                        <span>
                            <Translate id='wallet.dateAndTime' />
                        </span>
                        <span>
                            {dayjs(transPico2Date(tx.dateTime)).format(
                                'YYYY-MM-DD HH:mm'
                            )}
                        </span>
                    </div>
                    <div className='item'>
                        <span>Transaction Hash</span>
                        <span className='desc'>{tx.transactionHash}</span>
                    </div>
                    <FormButton
                        color='gray-blue'
                        linkTo={`${CONFIG.EXPLORER_URL}/txns/${tx.transactionHash}`}
                        trackingId='Click access key added view on explorer button'
                    >
                        <Translate id='button.viewOnExplorer' />
                    </FormButton>
                </div>
            </StyledContainer>
        </Modal>
    );
};

export default TransactionItemModal;

const StyledContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    &h2 {
        margin-bottom: 10px;
    }
    .subtitle {
        margin-top: 2px;
        word-break: break-all;
    }
    .desc {
        width: 50%;
        text-overflow: ellipsis;
        overflow: hidden;
        &.text-green {
            color: green;
        }
    }
    .icon {
        width: 28px;
        height: 28px;
    }

    .row {
        width: 100%;
        max-width: 400px;
        margin: 40px auto;
    }

    .item {
        &.head-item {
            justify-content: flex-start;
            gap: 16px;
        }
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 15px 0;
        border-top: 1px solid #f0f0f1;

        :last-of-type {
            border-bottom: 1px solid #f0f0f1;
        }

        @media (max-width: 767px) {
            margin: 0 -25px;
            padding: 15px;
        }

        > span {
            :first-of-type {
                color: #a2a2a8;

                > span > span {
                    color: #3f4045;
                }
            }
        }
    }

    button {
        &.gray-blue {
            width: 100% !important;
            max-width: 400px;
        }
    }
`;
