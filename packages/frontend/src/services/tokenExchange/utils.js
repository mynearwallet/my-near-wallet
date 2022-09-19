import Big from 'big.js';

import { NEAR_ID, NEAR_TOKEN_ID } from '../../config';
import { parseTokenAmount } from '../../utils/amounts';
import { MAX_PERCENTAGE } from '../../utils/constants';

export const isNearTransformation = (params) => {
    const { tokenIn, tokenOut } = params;
    const ids = [tokenIn.contractName, tokenOut.contractName];

    return ids.includes(NEAR_TOKEN_ID) && ids.includes(NEAR_ID);
};

export const replaceNearIfNecessary = (id) => {
    return id === NEAR_ID ? NEAR_TOKEN_ID : id;
};

// taken from the 'ref-contracts' repository
const FEE_DIVISOR = 10_000;

export const formatTotalFee = (fee) => {
    // transform to usual percent notation relative to 100%
    return Number(Big(fee).div(FEE_DIVISOR).times(MAX_PERCENTAGE).toFixed());
};

export const estimatePoolInfo = ({
    pool,
    tokenInId,
    tokenInDecimals,
    amountIn,
    tokenOutId,
}) => {
    const { total_fee, token_account_ids, amounts } = pool;
    const tokenInfo = {
        [token_account_ids[0]]: amounts[0],
        [token_account_ids[1]]: amounts[1],
    };

    const reserveIn = tokenInfo[tokenInId];
    const reserveOut = tokenInfo[tokenOutId];
    const amountInWithFee = parseTokenAmount(amountIn, tokenInDecimals) * (FEE_DIVISOR - total_fee);
    const amountOut =
        (amountInWithFee * reserveOut) /
        (FEE_DIVISOR * reserveIn + amountInWithFee);

    return { pool, amountOut };
};

export const findBestSwapPool = ({ poolsByIds, ...restParams }) => {
    let bestPool;
    let bestAmountOut;

    Object.values(poolsByIds)
        .map((pool) =>
            estimatePoolInfo({
                pool,
                ...restParams,
            })
        )
        .forEach(({ pool, amountOut }) => {
            if (!bestPool || amountOut > bestAmountOut) {
                bestPool = pool;
                bestAmountOut = amountOut;
            }
        });

    return { pool: bestPool, amountOut: bestAmountOut };
};
