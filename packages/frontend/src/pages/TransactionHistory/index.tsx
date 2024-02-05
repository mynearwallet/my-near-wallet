import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { Translate } from 'react-localize-redux';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import Container from '../../components/common/styled/Container.css';
import { TransactionItem } from '../../components/transactions/TransactionItem';
import CONFIG from '../../config';
import { selectAccountId } from '../../redux/slices/account';
import {
    transactionHistoryActions,
    transactionHistorySelector,
} from '../../redux/slices/transactionHistory';
import {
    groupedByDate,
    transactionToHistoryUIData,
} from '../../redux/slices/transactionHistory/utils';

const TransactionHistory = () => {
    const dispatch = useDispatch();
    const accountId = useSelector(selectAccountId);
    const { transactions, isLoading, hasMore } = useSelector(transactionHistorySelector);
    const [page, setPage] = useState(0);

    if (!transactions) {
        return null;
    }

    const tx = transactions.map((transaction) =>
        transactionToHistoryUIData(transaction, accountId, CONFIG.NETWORK_ID)
    );
    const groupedTransactions = groupedByDate(tx);

    function loadMore() {
        if (accountId && !isLoading) {
            // @ts-ignore:next-line
            dispatch(transactionHistoryActions.fetchTransactions({ accountId, page }));
            setPage((p) => p + 1);
        }
    }

    return (
        <Container>
            <h2>
                <Translate id='dashboard.activity' />
            </h2>
            <InfiniteScroll
                pageStart={0}
                loadMore={loadMore}
                hasMore={hasMore}
                loader={
                    <div className='loader' key={0}>
                        <Translate id='loading' />
                    </div>
                }
            >
                {groupedTransactions.map((g) => {
                    return (
                        <StyledTxDayContainer key={g.date}>
                            <div>{g.date}</div>
                            {g.transactions?.map((transaction) => {
                                return (
                                    <TransactionItem
                                        key={`${transaction.leftCaption}`}
                                        {...transaction}
                                    />
                                );
                            })}
                         </StyledTxDayContainer>
                    );
                })}
            </InfiniteScroll>
            {transactions?.length === 0 && page !== 1 && !isLoading && (
                <div className='no-activity'>
                    <Translate id='dashboard.noActivity' />
                </div>
            )}
        </Container>
    );
};

export default TransactionHistory;

const StyledTxDayContainer = styled.div`
    margin-bottom: 28px;
`;
