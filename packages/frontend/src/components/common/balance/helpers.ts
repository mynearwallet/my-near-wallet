import BN from 'bn.js';
import {
    formatNearAmount as apiFormatNearAmount,
    NEAR_NOMINATION_EXP,
} from 'near-api-js/lib/utils/format';

import { NEAR_FRACTIONAL_DIGITS } from './config';
import { formatTokenAmount } from '../../../utils/amounts';

type Amount = string | number | BN;

const VERY_LITTLE_NEAR: string = '< 0.' + '0'.repeat(NEAR_FRACTIONAL_DIGITS - 1) + '1';

export const YOCTO_NEAR_THRESHOLD: BN = new BN(
    '4' + '9'.repeat(NEAR_NOMINATION_EXP - NEAR_FRACTIONAL_DIGITS - 1)
);

function isZero(inputAmount: Amount): boolean {
    const amount: string = inputAmount.toString();

    const pattern: RegExp = /^0+$/;

    if (pattern.test(amount)) {
        return true;
    }

    return false;
}

export const formatNearAmount = (amount: Amount): string => {
    if (isZero(amount)) {
        return '0';
    }

    const formattedAmount: string = apiFormatNearAmount(amount, NEAR_FRACTIONAL_DIGITS);

    if (formattedAmount === '0') {
        return VERY_LITTLE_NEAR;
    }

    return formattedAmount;
};

export const showInYocto = (amount: string): string => {
    return formatWithCommas(amount) + ' yoctoNEAR';
};

export function formatErrorBalance(message: string): string {
    const regExp: RegExp = /\d* yoctoNEAR/;
    const yoctoSubString: RegExpMatchArray = message.match(regExp);

    if (yoctoSubString) {
        const nearAmount = formatNearAmount(yoctoSubString[0].split(' ')[0]);
        return message.replace(regExp, nearAmount + ' NEAR');
    }

    return message;
}

export const formatWithCommas = (value: string): string => {
    const pattern = /(-?\d+)(\d{3})/;

    while (pattern.test(value)) {
        value = value.toString().replace(pattern, '$1,$2');
    }

    return value;
};

interface GetBalanceInFiatParams {
    amount: Amount;
    tokenFiatValue: number;
    isContract?: boolean;
    decimals?: number;
}

export const getBalanceInFiat = (params: GetBalanceInFiatParams): number => {
    const { amount, tokenFiatValue, isContract, decimals } = params;

    if (isZero(amount)) {
        return 0;
    }

    const formattedNearAmount: string = isContract
        ? formatTokenAmount(amount, decimals, decimals)
        : formatNearAmount(amount);

    const balanceInFiat: number = parseFloat(formattedNearAmount) * tokenFiatValue;

    return balanceInFiat;
};

export const getRoundedBalanceInFiat = (params: GetBalanceInFiatParams): string => {
    const balanceInFiat = getBalanceInFiat(params);

    if (balanceInFiat === 0) {
        return '-';
    }

    const roundedBalanceInFiat: string = balanceInFiat.toFixed(2);

    if (roundedBalanceInFiat === '0.00') {
        return '< 0.01';
    }

    return roundedBalanceInFiat;
};

interface Token {
    contractName?: any;
    balance: Amount;
    fiatValueMetadata: {
        usd: number;
    };
    onChainFTMetadata?: {
        decimals: number;
    };
}

function calculateTokenValue(token: Token): string {
    const tokenFiatValue = token.fiatValueMetadata.usd;
    const amount = token.balance;

    if (token.contractName) {
        return getRoundedBalanceInFiat({
            amount,
            tokenFiatValue,
            isContract: true,
            decimals: token.onChainFTMetadata?.decimals,
        });
    }

    return getRoundedBalanceInFiat({
        amount,
        tokenFiatValue,
    });
}

export const getTotalBalanceInFiat = (mainTokens: Token[], currentLanguage: string) => {
    const totalAmount: string = mainTokens
        .map((token: Token) => calculateTokenValue(token))
        .filter((tokenValue: string) => !isZero(tokenValue))
        .reduce(
            (a: string, b: string) => (parseFloat(a) + parseFloat(b)).toString(),
            '0'
        );

    return new Intl.NumberFormat(`${currentLanguage}`, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    }).format(parseFloat(totalAmount));
};

export const getNearAndFiatValue = (amount, tokenFiatValue, fiat = 'usd') => {
    const nearAmount = formatNearAmount(amount);

    const fiatAmount = getRoundedBalanceInFiat({
        amount: amount,
        tokenFiatValue,
    });

    const fiatSymbol = fiat.toUpperCase();

    const fiatPrefix = fiatAmount !== '< 0.01' ? '≈ ' : '';

    return `${nearAmount} NEAR (${fiatPrefix}${
        formatWithCommas(fiatAmount) || '—'
    } ${fiatSymbol})`;
};

export const getTotalBalanceFromFungibleTokensListUSD = (fungibleTokensList: Token) => {
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
