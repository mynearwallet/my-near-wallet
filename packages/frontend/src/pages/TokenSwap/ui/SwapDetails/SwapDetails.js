import React, { useEffect, useState } from 'react';

import Accordion from '../../../../components/common/Accordion';
import SafeTranslate from '../../../../components/SafeTranslate';
import ChevronIcon from '../../../../components/svg/ChevronIcon';
import useIsMounted from '../../../../hooks/useIsMounted';
import { cutDecimalsIfNeeded } from '../../../../utils/amounts';
import { useSwapData } from '../../model/Swap';
import {
    getSwapCost,
    getMinAmountOut,
    getSwapFeeAmount,
} from '../../utils/calculations';
import { DECIMALS_TO_SAFE } from '../../utils/constants';
import FtSwapDetails from './FtSwapDetails';
import NearTransformationDetails from './NearTransformationDetails';
import { SwapDetailsWrapper, AccordionTitle } from './ui';

export default function SwapDetails() {
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

    const isMounted = useIsMounted();
    const [isActive, setIsActive] = useState(false);

    const toggleDetailsView = () => setIsActive((view) => !view);

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

    const translateData = {
        from: `${cutDecimalsIfNeeded(amountIn, DECIMALS_TO_SAFE)} ${
            tokenIn?.onChainFTMetadata?.symbol
        }`,
        to: `${cutDecimalsIfNeeded(amountOut, DECIMALS_TO_SAFE)} ${
            tokenOut?.onChainFTMetadata?.symbol
        }`,
    };

    if (!tokenIn || !tokenOut || !amountIn || !amountOut) {
        return null;
    }

    return (
        <SwapDetailsWrapper>
            <AccordionTitle id="swapDetailsTitle" className={`${isActive ? 'active' : ''}`} onClick={toggleDetailsView}>
                <SafeTranslate id='swap.priceRation' data={translateData} />
                <ChevronIcon color='var(--color-1)'/>
            </AccordionTitle>
            <Accordion
                trigger='swapDetailsTitle'
                className='breakdown'
            >
                {isNearTransformation ? (
                    <NearTransformationDetails
                        minAmountOut={amountIn}
                        estimatedFee={estimatedFee}
                    />
                ) : (
                    <FtSwapDetails
                        minAmountOut={minAmountOutToShow}
                        swapFeeAmount={swapFeeAmount}
                        estimatedFee={estimatedFee}
                    />
                )}
            </Accordion>
        </SwapDetailsWrapper>
    );
}
