import Big from 'big.js';

import {
    parseTokenAmount,
    formatTokenAmount,
    removeTrailingZeros,
} from '../../utils/amounts';
import { MAX_PERCENTAGE } from '../../utils/constants';

// taken from the RefFinance 'ref-contracts' repository
const FEE_DIVISOR = 10_000;

// calculate fee multiplier relative to 100%
const getFeeMultiplier = (fee) => {
    return Big(1).minus(Big(fee).div(FEE_DIVISOR)).toFixed();
};

// transform to usual percent notation relative to 100%
export const formatTotalFee = (fee) => {
    return Number(Big(fee).div(FEE_DIVISOR).times(MAX_PERCENTAGE).toFixed());
};

const getAmountOut = ({
    pool,
    tokenInId,
    tokenInDecimals,
    amountIn,
    tokenOutId,
}) => {
    const { total_fee, token_account_ids, amounts } = pool;
    const tokenReserve = {
        [token_account_ids[0]]: amounts[0],
        [token_account_ids[1]]: amounts[1],
    };

    try {
        const reserveIn = tokenReserve[tokenInId];
        const reserveOut = tokenReserve[tokenOutId];
        const amountInWithFee =
            parseTokenAmount(amountIn, tokenInDecimals) * (FEE_DIVISOR - total_fee);

        const amountOut =
            (amountInWithFee * reserveOut) /
            (FEE_DIVISOR * reserveIn + amountInWithFee);

        return amountOut;
    } catch (error) {
        console.error('Error in output amount calculation', error);
        return '';
    }
};

export const findBestSwapPool = ({ poolsByIds, ...restParams }) => {
    let bestPool;
    let bestAmountOut;

    Object.values(poolsByIds).forEach((pool) => {
        const amountOut = getAmountOut({
            pool,
            ...restParams,
        });

        if (!bestPool || amountOut > bestAmountOut) {
            bestPool = pool;
            bestAmountOut = amountOut;
        }
    });

    return { pool: bestPool, amountOut: bestAmountOut };
};

/**
 *
 *                   new market price - current market price
 * Price impact % =  --------------------------------------- * 100 %
 *                            new market price
 *
 */
export const getPriceImpactPercent = ({
    pool,
    tokenInId,
    tokenInDecimals,
    amountIn,
    tokenOutId,
    tokenOutDecimals,
}) => {
    const { token_account_ids, amounts, total_fee = 0 } = pool;
    const tokenReserve = {
        [token_account_ids[0]]: amounts[0],
        [token_account_ids[1]]: amounts[1],
    };

    try {
        const reserveIn = formatTokenAmount(
            tokenReserve[tokenInId],
            tokenInDecimals,
            tokenInDecimals
        );
        const reserveOut = formatTokenAmount(
            tokenReserve[tokenOutId],
            tokenOutDecimals,
            tokenOutDecimals
        );

        const constantProduct = Big(reserveIn).times(reserveOut);
        const currentMarketPrice = Big(reserveIn).div(reserveOut);
        const amountInWithFee = Big(amountIn).times(getFeeMultiplier(total_fee));

        const newReserveIn = Big(reserveIn).plus(amountInWithFee);
        const newReserveOut = constantProduct.div(newReserveIn);

        const amountOut = Big(reserveOut).minus(newReserveOut);
        const newMarketPrice = Big(amountInWithFee).div(amountOut);

        const priceImpact = newMarketPrice
            .minus(currentMarketPrice)
            .div(newMarketPrice)
            .times(MAX_PERCENTAGE)
            .toFixed(2);

        return removeTrailingZeros(priceImpact);
    } catch (error) {
        console.error('Error in price impact calculation', error);
        return '';
    }
};
