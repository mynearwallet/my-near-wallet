import Big from 'big.js';
import React, { useState } from 'react';

import FtSwapDetails from './FtSwapDetails';
import NearTransformationDetails from './NearTransformationDetails';
import { SwapDetailsWrapper, AccordionTitle } from './ui';
import Accordion from '../../../../components/common/Accordion';
import ChevronIcon from '../../../../components/svg/ChevronIcon';
import { toSignificantDecimals } from '../../../../utils/amounts';
import { useSwapData } from '../../model/Swap';
import { getMinAmountOut, getSwapFeeAmount } from '../../utils/calculations';
import { DECIMALS_TO_SAFE } from '../../utils/constants';

export default function SwapDetails() {
    const {
        swapState: {
            tokenIn,
            amountIn,
            tokenOut,
            amountOut,
            slippage,
            swapFee,
            estimatedFee,
            v2Quote,
            isNearTransformation,
        },
    } = useSwapData();

    const [isActive, setIsActive] = useState(false);

    const toggleDetailsView = () => setIsActive((view) => !view);

    const swapFeeAmount = getSwapFeeAmount({
        amountIn,
        swapFee,
    });
    const minAmountOut = v2Quote?.minAmountOut || getMinAmountOut({
        tokenOut,
        amountOut,
        slippage,
    });
    const minAmountOutToShow = toSignificantDecimals(
        v2Quote ? Big(minAmountOut).toPrecision(DECIMALS_TO_SAFE, Big.roundDown) : minAmountOut,
        DECIMALS_TO_SAFE
    );

    const isVisible = tokenIn && tokenOut && Number(amountIn);
    let price = '-';

    if (isVisible && amountOut) {
        if (Number(amountOut) !== 0) {
            price = toSignificantDecimals(
                Big(amountIn).div(amountOut).toFixed(),
                DECIMALS_TO_SAFE
            );
        }
    }

    return (
        <SwapDetailsWrapper className={`${isVisible ? 'visible' : ''}`}>
            <AccordionTitle
                id='swapDetailsTitle'
                className={`${isActive ? 'active' : ''}`}
                onClick={toggleDetailsView}
            >
                1 {tokenOut?.onChainFTMetadata?.symbol}
                {' = '}
                {price} {tokenIn?.onChainFTMetadata?.symbol}
                <ChevronIcon color='var(--mnw-color-1)' />
            </AccordionTitle>
            <Accordion trigger='swapDetailsTitle' className='breakdown'>
                {isNearTransformation ? (
                    <NearTransformationDetails
                        minAmountOut={amountIn}
                        estimatedFee={v2Quote?.estimatedFee || estimatedFee}
                    />
                ) : (
                    <FtSwapDetails
                        minAmountOut={minAmountOutToShow}
                        swapFeeAmount={swapFeeAmount}
                        estimatedFee={v2Quote?.estimatedFee || estimatedFee}
                    />
                )}
            </Accordion>
        </SwapDetailsWrapper>
    );
}
