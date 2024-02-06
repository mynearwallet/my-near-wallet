import React, { useEffect } from 'react';
import { Translate } from 'react-localize-redux';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectAccountId } from '../../redux/slices/account';
import {
    transactionHistoryActions,
    transactionHistorySelector,
} from '../../redux/slices/transactionHistory';
import classNames from '../../utils/classNames';
import FormButton from '../common/FormButton';
import GroupedTransactions from '../transactions/GroupedTransactions';
import TransactionItemModal from '../transactions/TransactionItemModal.js';

const StyledContainer = styled.div`
    width: 100%;

    .no-activity {
        color: #b4b4b4;
        line-height: 150%;
    }

    @media (min-width: 992px) {
        border: 2px solid #f0f0f0;
        border-radius: 8px;
        padding: 20px;

        h2 {
            margin-bottom: 15px !important;
        }

        .activity-box {
            margin: 0 -20px;
            padding: 15px 20px;
            transition: 100ms;

            :hover {
                background-color: #f9f9f9;
            }

            :first-of-type {
                border-top: 1px solid #f0f0f1;
            }
        }

        && .subtitle {
            max-width: 170px;
        }
    }

    .activity-box {
        border-bottom: 1px solid #f0f0f1;

        :last-of-type {
            border-bottom: 0;
        }
    }

    h2 {
        margin-top: 0 !important;
    }

    .dots {
        :after {
            position: absolute;
            content: '.';
            animation: link 1s steps(5, end) infinite;

            @keyframes link {
                0%,
                20% {
                    color: rgba(0, 0, 0, 0);
                    text-shadow: 0.3em 0 0 rgba(0, 0, 0, 0), 0.6em 0 0 rgba(0, 0, 0, 0);
                }
                40% {
                    color: #24272a;
                    text-shadow: 0.3em 0 0 rgba(0, 0, 0, 0), 0.6em 0 0 rgba(0, 0, 0, 0);
                }
                60% {
                    text-shadow: 0.3em 0 0 #24272a, 0.6em 0 0 rgba(0, 0, 0, 0);
                }
                80%,
                100% {
                    text-shadow: 0.3em 0 0 #24272a, 0.6em 0 0 #24272a;
                }
            }
        }
    }
`;

const ActivitiesWrapper = () => {
    const dispatch = useDispatch();

    const accountId = useSelector(selectAccountId);
    const { transactions, isLoading } = useSelector(transactionHistorySelector);

    useEffect(() => {
        if (accountId) {
            dispatch(transactionHistoryActions.fetchTransactions({ accountId, page: 1 }));
        }
    }, [accountId]);

    return (
        <StyledContainer>
            <h2 className={classNames({ dots: isLoading })}>
                <Translate id='dashboard.activity' />
            </h2>
            <GroupedTransactions transactions={transactions} />
            {transactions?.length === 0 && !isLoading && (
                <div className='no-activity'>
                    <Translate id='dashboard.noActivity' />
                </div>
            )}
            <TransactionItemModal />
            <FormButton
                color='gray-blue'
                linkTo='transaction-history'
                trackingId='Click to account on explorer'
            >
                <Translate id='button.viewAll' />
            </FormButton>
        </StyledContainer>
    );
};

export default ActivitiesWrapper;
