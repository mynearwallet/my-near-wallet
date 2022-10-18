import React, { useEffect, useState } from 'react';

import useIsMounted from '../../../../hooks/useIsMounted';
import { cutDecimalsIfNeeded } from '../../../../utils/amounts';
import { useSwapData } from '../../model/Swap';
import { getSwapCost, getMinAmountOut, getSwapFeeAmount } from '../../utils/calculations';
import { DECIMALS_TO_SAFE } from '../../utils/constants';
import FtSwapDetails from './FtSwapDetails';
import NearTransformationDetails from './NearTransformationDetails';

export default function SwapDetails() {
    const isMounted = useIsMounted();

    const {
        swapState: {
            tokenIn,
            amountIn,
            tokenOut,
            amountOut,
            slippage,
            swapFee,
            isNearTransformation,
        },
    } = useSwapData();

    const [estimatedFee, setEstimatedFee] = useState('');

    useEffect(() => {
        const fetch = async () => {
            const fee = await getSwapCost(tokenIn, tokenOut);

            if (isMounted) {
                setEstimatedFee(fee);
            }
        };

        fetch();
    }, [tokenIn, tokenOut, isMounted]);

    const swapFeeAmount = getSwapFeeAmount({
        amountIn,
        swapFee,
    });
    const minAmountOut = getMinAmountOut({
        tokenOut,
        amountOut,
        slippage,
    });
    const minAmountOutToShow = cutDecimalsIfNeeded(
        minAmountOut,
        DECIMALS_TO_SAFE
    );

    return isNearTransformation && amountIn && amountOut ? (
        <NearTransformationDetails
            minAmountOut={amountIn}
            estimatedFee={estimatedFee}
        />
    ) : tokenIn && tokenOut && amountIn && amountOut ? (
        <FtSwapDetails
            minAmountOut={minAmountOutToShow}
            swapFeeAmount={swapFeeAmount}
            estimatedFee={estimatedFee}
        />
    ) : null;
}
