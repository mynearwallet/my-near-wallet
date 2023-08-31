import React from 'react';
import { useSelector } from 'react-redux';

import SignTransactionDetails from './SignTransactionDetails';
import { selectAccountUrlPrivateShard } from '../../../redux/slices/account';
import { selectSignTransactions } from '../../../redux/slices/sign';

export default ({ onClickGoBack, signGasFee }) => {
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
