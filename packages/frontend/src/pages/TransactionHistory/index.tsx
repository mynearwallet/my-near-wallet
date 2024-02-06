import React, { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { Translate } from 'react-localize-redux';
import { useDispatch, useSelector } from 'react-redux';

import Container from '../../components/common/styled/Container.css';
import GroupedTransactions from '../../components/transactions/GroupedTransactions';
import TransactionItemModal from '../../components/transactions/TransactionItemModal';
import { selectAccountId } from '../../redux/slices/account';
import {
    transactionHistoryActions,
    transactionHistorySelector,
} from '../../redux/slices/transactionHistory';

const TransactionHistory = () => {
    const dispatch = useDispatch();
    const accountId = useSelector(selectAccountId);
    const { transactions, isLoading, hasMore } = useSelector(transactionHistorySelector);
    const [page, setPage] = useState(0);

    if (!transactions) {
        return null;
    }

    function loadMore() {
        if (accountId && !isLoading) {
            // @ts-ignore:next-line
            dispatch(transactionHistoryActions.fetchTransactions({ accountId, page }));
            setPage((p) => p + 1);
        }
    }

    // reset on change account
    useEffect(() => {
        setPage(0);
        dispatch(transactionHistoryActions.setTransactions([]));
        // @ts-ignore:next-line
        dispatch(transactionHistoryActions.fetchTransactions({ accountId, page: 1 }));
    }, [accountId]);

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
                <GroupedTransactions transactions={transactions} />
            </InfiniteScroll>
            <TransactionItemModal />
        </Container>
    );
};

export default TransactionHistory;
