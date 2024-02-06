import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { TransactionItem } from './TransactionItem';
import CONFIG from '../../config';
import { selectAccountId } from '../../redux/slices/account';
import { transactionHistoryActions } from '../../redux/slices/transactionHistory';
import { ITransactionListItem } from '../../redux/slices/transactionHistory/type';
import {
    groupedByDate,
    transactionToHistoryUIData,
} from '../../redux/slices/transactionHistory/utils';

type Props = {
    transactions: ITransactionListItem[];
};

const GroupedTransactions = ({ transactions }: Props) => {
    const accountId = useSelector(selectAccountId);
    const tx = transactions.map((transaction) =>
        transactionToHistoryUIData(transaction, accountId, CONFIG.NETWORK_ID)
    );
    const groupedTransactions = groupedByDate(tx);

    const dispatch = useDispatch();
    return groupedTransactions.map((g) => {
        return (
            <StyledTxDayContainer key={g.date}>
                <div>{g.date}</div>
                {g.transactions?.map((transaction) => {
                    return (
                        <TransactionItem
                            key={`${transaction.transactionHash}`}
                            onClick={() =>
                                dispatch(
                                    transactionHistoryActions.setSelectedTx(
                                        transaction.transactionHash
                                    )
                                )
                            }
                            onClickTransactionHash={() => {
                                navigator.clipboard?.writeText(
                                    transaction.transactionHash
                                );
                            }}
                            {...transaction}
                        />
                    );
                })}
            </StyledTxDayContainer>
        );
    });
};

export default GroupedTransactions;

const StyledTxDayContainer = styled.div`
    margin-bottom: 28px;
    h2 {
        font-size: 18px;
    }
`;
