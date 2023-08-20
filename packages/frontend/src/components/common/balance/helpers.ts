import BN from 'bn.js';
import { utils } from 'near-api-js';

import { NEAR_FRACTIONAL_DIGITS } from './config';
import { formatTokenAmount } from '../../../utils/amounts';

type Amount = string | number | BN;

export const YOCTO_NEAR_THRESHOLD = new BN('10', 10).pow(
    new BN(utils.format.NEAR_NOMINATION_EXP - NEAR_FRACTIONAL_DIGITS + 1, 10)
);

export const formatNearAmount = (inputAmount: Amount): string => {
    const amount: string = inputAmount.toString();

    const pattern: RegExp = /^0+$/;

    if (pattern.test(amount)) {
        return '0';
    }

    const formattedAmount = utils.format.formatNearAmount(amount, NEAR_FRACTIONAL_DIGITS);

    if (formattedAmount === '0') {
        return '< 0.' + '0'.repeat(NEAR_FRACTIONAL_DIGITS - 1) + '1';
    }

    return formattedAmount;
};

export const showInYocto = (amountStr) => {
    return formatWithCommas(amountStr) + ' yoctoNEAR';
};

export function formatErrorBalance(msg) {
    const regExp = /\d* yoctoNEAR/;
    const yoctoSubString = msg.match(regExp);
    if (yoctoSubString) {
        const nearAmount = formatNearAmount(yoctoSubString[0].split(' ')[0]);
        return msg.replace(regExp, nearAmount + ' NEAR');
    }

    return msg;
}

export const formatWithCommas = (value) => {
    const pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(value)) {
        value = value.toString().replace(pattern, '$1,$2');
    }
    return value;
};

export const getRoundedBalanceInFiat = (
    amount,
    tokenFiatValue,
    isNear?: boolean,
    decimals?: number
) => {
    const formattedNearAmount =
        amount && !isNear
            ? formatNearAmount(amount).replace(/,/g, '')
            : formatTokenAmount(amount, decimals, decimals);
    const balanceInFiat = Number(formattedNearAmount) * tokenFiatValue;
    const roundedBalanceInFiat = balanceInFiat && balanceInFiat.toFixed(2);

    // Steve Code Scan:
    if (roundedBalanceInFiat === '0.00' || formattedNearAmount === '< 0.00001') {
        return '< $0.01';
    }

    return roundedBalanceInFiat;
};

export const getTotalBalanceInFiat = (mainTokens, currentLanguage) => {
    const totalAmount = mainTokens
        .map((el) => {
            const USD = el.fiatValueMetadata.usd;
            const balance = el.balance;
            return el.contractName
                ? getRoundedBalanceInFiat(
                      balance,
                      USD,
                      true,
                      el.onChainFTMetadata.decimals
                  )
                : getRoundedBalanceInFiat(balance, USD);
        })
        .filter((x) => !!x)
        .reduce((a, b) => `${+a + +b}`, []);
    return !isNaN(totalAmount)
        ? new Intl.NumberFormat(`${currentLanguage}`, {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
          }).format(totalAmount)
        : '0';
};

export const getNearAndFiatValue = (rawNearAmount, tokenFiatValue, fiat = 'usd') => {
    const nearAmount = formatNearAmount(rawNearAmount);
    const fiatAmount = getRoundedBalanceInFiat(rawNearAmount, tokenFiatValue);
    const fiatSymbol = fiat.toUpperCase();
    const fiatPrefix = fiatAmount !== '< 0.01' ? '≈ ' : '';
    return `${nearAmount} NEAR (${fiatPrefix}${
        formatWithCommas(fiatAmount) || '—'
    } ${fiatSymbol})`;
};

export const getTotalBalanceFromFungibleTokensListUSD = (fungibleTokensList) => {
    let totalBalanceUSD = 0;
    const tokensWithUSDValue = fungibleTokensList.filter(
        (token) => typeof token?.fiatValueMetadata?.usd === 'number'
    );
    for (const token of tokensWithUSDValue) {
        totalBalanceUSD +=
            token.fiatValueMetadata.usd *
            formatTokenAmount(token.balance, token.onChainFTMetadata?.decimals, 5);
    }
    return Number(totalBalanceUSD.toFixed(2));
};
