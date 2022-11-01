import React from 'react';

import { formatTokenAmount, removeTrailingZeros } from '../../../utils/amounts';
import BalanceDisplayUSD from '../balance/BalanceDisplayUSD';

const FRAC_DIGITS = 5;

const amountWithCommas = (amount) => {
    var parts = amount.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
};

const formatToken = (amount, decimals) => {
    if (amount === '0') {
        return amount;
    }

    let formattedAmount = formatTokenAmount(amount, decimals, FRAC_DIGITS);

    if (formattedAmount === `0.${'0'.repeat(FRAC_DIGITS)}`) {
        return `< ${
            !FRAC_DIGITS ? '0' : `0.${'0'.repeat((FRAC_DIGITS || 1) - 1)}1`
        }`;
    }
    return amountWithCommas(removeTrailingZeros(formattedAmount));
};

const showFullAmount = (amount, decimals, symbol) =>
    amount !== '0' && !!amount
        ? `${formatTokenAmount(amount, decimals, decimals)} ${symbol}`
        : '';

const TokenAmount = ({
    token: { balance, onChainFTMetadata, fiatValueMetadata },
    withSymbol = false,
    className,
    showFiatAmount = true,
    'data-test-id': testId,
    balancePrefix = ''
}) => (
    <div
        className={className}
        title={showFullAmount(
            balance,
            onChainFTMetadata?.decimals,
            onChainFTMetadata?.symbol
        )}
        data-test-id={testId}
    >
        <div>
            {balance ? (
                balancePrefix + formatToken(balance, onChainFTMetadata?.decimals)
            ) : (
                <span className="dots" />
            )}
            <span className="currency">
                {withSymbol ? ` ${onChainFTMetadata?.symbol}` : null}
            </span>
        </div>
        {showFiatAmount ? (
            <div className="fiat-amount">
                <BalanceDisplayUSD
                    amount={balance}
                    nearTokenFiatValueUSD={fiatValueMetadata?.usd}
                    decimals={onChainFTMetadata?.decimals}
                    isNear={true}
                />
            </div>
        ) : null}
    </div>
);

export default TokenAmount;
