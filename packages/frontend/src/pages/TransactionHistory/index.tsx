import React, { useEffect } from 'react';
import { Translate } from 'react-localize-redux';
import { useDispatch, useSelector } from 'react-redux';

import { TransactionItem } from '../../components/transactions/TransactionItem';
import CONFIG from '../../config';
import { selectAccountId } from '../../redux/slices/account';
import {
    transactionHistoryActions,
    transactionHistorySelector,
} from '../../redux/slices/transactionHistory';
import { transactionToHistoryUIData } from '../../redux/slices/transactionHistory/utils';
import { selectTransactionsLoading } from '../../redux/slices/transactions';
import Container from '../../components/common/styled/Container.css';

const TransactionHistory = () => {
    const dispatch = useDispatch();
    const accountId = useSelector(selectAccountId);
    const transactions = useSelector(transactionHistorySelector);

    const activityLoader = useSelector((state) =>
            // @ts-ignore:next-line
        selectTransactionsLoading(state, { accountId })
    );

    useEffect(() => {
        if (accountId) {
            // @ts-ignore:next-line
            dispatch(transactionHistoryActions.fetchTransactions({ accountId, page: 1 }));
        }
    }, [accountId]);
    return (
        <Container>
            <h2>
                <Translate id='dashboard.activity' />
            </h2>
            {transactions?.map((transaction) => {
                const tx = transactionToHistoryUIData(
                    transaction,
                    accountId,
                    CONFIG.NETWORK_ID
                );
                return (
                    <TransactionItem key={`${transaction.transaction.hash}`} {...tx} />
                );
            })}
            {transactions?.length === 0 && !activityLoader && (
                <div className='no-activity'>
                    <Translate id='dashboard.noActivity' />
                </div>
            )}
        </Container>
    );
};

export default TransactionHistory;
