import Big from 'big.js';

import { NEAR_ID, NEAR_TOKEN_ID } from '../../config';
import {
    parseTokenAmount,
    formatTokenAmount,
    removeTrailingZeros,
} from '../../utils/amounts';
import { MAX_PERCENTAGE } from '../../utils/constants';

export const isNearTransformation = (params) => {
    const { tokenIn, tokenOut } = params;
    const ids = [tokenIn.contractName, tokenOut.contractName];

    return ids.includes(NEAR_TOKEN_ID) && ids.includes(NEAR_ID);
};

export const replaceNearIfNecessary = (id) => {
    return id === NEAR_ID ? NEAR_TOKEN_ID : id;
};

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

    const reserveIn = tokenReserve[tokenInId];
    const reserveOut = tokenReserve[tokenOutId];
    const amountInWithFee =
        parseTokenAmount(amountIn, tokenInDecimals) * (FEE_DIVISOR - total_fee);

    const amountOut =
        (amountInWithFee * reserveOut) /
        (FEE_DIVISOR * reserveIn + amountInWithFee);

    return amountOut;
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
    const { token_account_ids, amounts } = pool;
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
        const newReserveIn = Big(reserveIn).plus(amountIn);
        const newReserveOut = constantProduct.div(newReserveIn);

        const currentMarketPrice = Big(reserveIn).div(reserveOut);
        const amountOut = Big(reserveOut).minus(newReserveOut);
        const newMarketPrice = Big(amountIn).div(amountOut);

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
