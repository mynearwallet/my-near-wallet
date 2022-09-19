import { useMemo } from 'react';

import { decreaseByPercent, getPercentFrom } from '../../../../utils/amounts';

export default function useCalculatedValues({
    amountIn,
    tokenOut,
    amountOut,
    slippage,
    swapFee,
}) {
    const minAmountOut = useMemo(() => {
        if (
            typeof slippage === 'number' &&
            tokenOut?.onChainFTMetadata?.decimals &&
            amountOut
        ) {
            if (!slippage) {
                return amountOut;
            }

            return Number(decreaseByPercent(
                amountOut,
                slippage,
                tokenOut.onChainFTMetadata.decimals
            ));
        }

        return '';
    }, [slippage, tokenOut, amountOut]);

    const exchangeRate = useMemo(() => {
        if (amountIn && amountOut) {
            return amountIn / amountOut;
        }

        return 1;
    }, [amountIn, amountOut]);

    const tradingFee = useMemo(() => {
        if (amountIn && swapFee >= 0) {
            return Number(getPercentFrom(amountIn, swapFee));
        }
        
        return 0;
    }, [amountIn, swapFee]);

    return { minAmountOut, exchangeRate, tradingFee };
}
