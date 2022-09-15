import { NEAR_ID, NEAR_TOKEN_ID } from '../../config';
import { formatTokenAmount } from '../../utils/amounts';

export const isNearTransformation = (params) => {
    const { tokenIn, tokenOut } = params;
    const ids = [tokenIn.contractName, tokenOut.contractName];

    return ids.includes(NEAR_TOKEN_ID) && ids.includes(NEAR_ID);
};

export const replaceNearIfNecessary = (id) => {
    return id === NEAR_ID ? NEAR_TOKEN_ID : id;
};

// taken from the 'ref-contracts' repo
const FEE_DIVISOR = 10_000;

export const estimatePoolInfo = ({
    pool,
    tokenInId,
    tokenInDecimals,
    amountIn,
    tokenOutId,
    tokenOutDecimals,
}) => {
    const { total_fee, token_account_ids, amounts } = pool;
    const tokenInfo = {
        [token_account_ids[0]]: amounts[0],
        [token_account_ids[1]]: amounts[1],
    };

    const reserveIn = formatTokenAmount(
        tokenInfo[tokenInId],
        tokenInDecimals,
        tokenInDecimals
    );
    const reserveOut = formatTokenAmount(
        tokenInfo[tokenOutId],
        tokenOutDecimals,
        tokenOutDecimals
    );
    const amountInWithFee = amountIn * (FEE_DIVISOR - total_fee);
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
