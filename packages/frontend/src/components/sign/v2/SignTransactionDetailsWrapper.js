import React from 'react';
import { useSelector } from 'react-redux';

import { selectAccountUrlPrivateShard } from '../../../redux/slices/account';
import { selectSignTransactions } from '../../../redux/slices/sign';
import SignTransactionDetails from './SignTransactionDetails';

export default ({
    onClickGoBack,
    signGasFee
}) => {
    const transactions = useSelector(selectSignTransactions);
    const privateShardInfo = useSelector(selectAccountUrlPrivateShard);
    return (
        <SignTransactionDetails
            onClickGoBack={onClickGoBack}
            transactions={transactions}
            signGasFee={signGasFee}
            privateShardInfo={privateShardInfo}
        />
    );
};
