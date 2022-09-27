import { decreaseByPercent, getPercentFrom } from '../../../utils/amounts';

export function getCalculatedValues({
    amountIn,
    tokenOut,
    amountOut,
    slippage,
    swapFee,
}) {
    let minAmountOut = '';
    const canCalculateMinAmount =
        typeof slippage === 'number' &&
        tokenOut?.onChainFTMetadata?.decimals &&
        amountOut;

    if (canCalculateMinAmount) {
        minAmountOut = !slippage
            ? amountOut
            : decreaseByPercent(
                amountOut,
                slippage,
                tokenOut.onChainFTMetadata.decimals
            );
    }

    const exchangeRate = amountIn && amountOut ? amountIn / amountOut : 1;

    const tradingFee =
        amountIn && swapFee >= 0
            ? Number(getPercentFrom(amountIn, swapFee))
            : 0;

    return { minAmountOut, exchangeRate, tradingFee };
}
