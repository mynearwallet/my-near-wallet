import { NEAR_TOKEN_ID } from '../../config';
import { parseTokenAmount, formatTokenAmount } from '../../utils/amounts';

// @todo move it somewhere in configs (check if it exists already)
export const NEAR_ID = 'NEAR';

export const isNearSwap = (params) => {
    const { tokenIn, tokenOut } = params;
    const ids = [tokenIn.contractName, tokenOut.contractName];

    return ids.includes(NEAR_TOKEN_ID) && ids.includes(NEAR_ID);
};

export const replaceNearIfNecessary = (token) => {
    return token.contractName === NEAR_ID
        ? { ...token, contractName: NEAR_TOKEN_ID }
        : token;
};

// taken from the 'ref-contracts' repo
const FEE_DIVISOR = 10_000;

// @todo wrong calculations. The formula is correct, but amounts formatting is not
export const estimatePoolInfo = ({ pool, tokenIn, tokenOut, amountIn }) => {
    // console.group('%c estimate pool info', 'color: brown;');
    // console.log("pool", pool);
    // console.log("tokenIn", tokenIn);
    // console.log("tokenOut", tokenOut);
    // console.log("amountIn", amountIn);

    const { onChainFTMetadata: { decimals: tokenInDecimals } } = tokenIn;
    const { onChainFTMetadata: { decimals: tokenOutDecimals } } = tokenOut;
    const { total_fee, token_account_ids, amounts } = pool;
    const tokenInfo = {
        [token_account_ids[0]]: amounts[0],
        [token_account_ids[1]]: amounts[1],
    };

    const reserveIn = tokenInfo[tokenIn.contractName]; // formatTokenAmount(tokenInfo[tokenIn.contractName], tokenInDecimals, tokenInDecimals);
    const reserveOut = tokenInfo[tokenOut.contractName]; // formatTokenAmount(tokenInfo[tokenOut.contractName], tokenOutDecimals, tokenOutDecimals);
    const parsedAmountIn = parseTokenAmount(amountIn, tokenInDecimals, 0);
    const amountInWithFee = parsedAmountIn * (FEE_DIVISOR - total_fee);

    // console.log('reserveIn', reserveIn);
    // console.log('reserveOut', reserveOut);
    // console.log('parsedAmountIn', parsedAmountIn);
    // console.log('amountInWithFee', amountInWithFee);

    const amountOut = amountInWithFee * reserveOut / (FEE_DIVISOR * reserveIn + amountInWithFee);

    // console.log('🚀 amountOut', amountOut);
    // console.groupEnd();

    return { pool, amountOut };
};

export const findBestSwapPool = ({ poolsByIds, tokenIn, amountIn, tokenOut }) => {
    let bestPool;
    let bestAmountOut;

    Object.values(poolsByIds)
        .map((pool) =>
            estimatePoolInfo({
                pool,
                tokenIn,
                tokenOut,
                amountIn,
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
