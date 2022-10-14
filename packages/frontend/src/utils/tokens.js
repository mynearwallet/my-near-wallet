import { formatTokenAmount } from './amounts';

const sortTokens = (tokens, sortCallback) => {
    return Object.values(tokens)
        .sort(sortCallback)
        .reduce((allTokens, token) => ({ ...allTokens, [token.contractName]: token }), {});
};

export const sortTokensInDecreasingOrderByPrice = (tokens) => {
    return sortTokens(tokens, (t1, t2) => {
        const price1 = t1.fiatValueMetadata?.usd;
        const balance1 = formatTokenAmount(
            t1.balance,
            t1.onChainFTMetadata.decimals
        );
        const price2 = t2.fiatValueMetadata?.usd;
        const balance2 = formatTokenAmount(
            t2.balance,
            t2.onChainFTMetadata.decimals
        );

        if (typeof price1 !== 'number') {
            return 1;
        }

        if (typeof price2 !== 'number') {
            return -1;
        }

        return balance2 * price2 - balance1 * price1;
    });
};
