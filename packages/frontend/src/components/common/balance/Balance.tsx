import React from 'react';
import { useSelector } from 'react-redux';

import BalanceDisplay from './BalanceDisplay';
import { selectNearTokenFiatValueUSD } from '../../../redux/slices/tokenFiatValues/near';

interface IBalanceProps {
    totalAmount?: string;
    amount: string;
    showSymbolNEAR?: boolean;
    className?: string;
    showBalanceInNEAR?: boolean;
    showBalanceInUSD?: boolean;
    showAlmostEqualSignUSD?: boolean;
    showSignUSD?: boolean;
    showSymbolUSD?: boolean;
    showGenericSymbol?: boolean;
    symbol?: string;
    'data-test-id'?: string;
}

const Balance = ({
    totalAmount,
    amount,
    showSymbolNEAR,
    className,
    showBalanceInNEAR,
    showBalanceInUSD,
    showAlmostEqualSignUSD,
    showSignUSD,
    showSymbolUSD,
    showGenericSymbol,
    symbol,
    'data-test-id': testId,
}: IBalanceProps) => {
    const nearTokenFiatValueUSD = useSelector(selectNearTokenFiatValueUSD);

    return (
        <BalanceDisplay
            totalAmount={totalAmount}
            amount={amount}
            showSymbolNEAR={showSymbolNEAR}
            className={className}
            showBalanceInNEAR={showBalanceInNEAR}
            showBalanceInUSD={showBalanceInUSD}
            nearTokenFiatValueUSD={nearTokenFiatValueUSD}
            showAlmostEqualSignUSD={showAlmostEqualSignUSD}
            showSignUSD={showSignUSD}
            showSymbolUSD={showSymbolUSD}
            showGenericSymbol={showGenericSymbol}
            symbol={symbol}
            data-test-id={testId}
        />
    );
};

export default Balance;
