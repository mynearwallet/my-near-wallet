import React, { useEffect, useState } from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import Accordion from '../../../../components/common/Accordion';
import Tooltip from '../../../../components/common/Tooltip';
import AccordionTrigger from '../../../../components/send/components/AccordionTrigger';
import Breakdown from '../../../../components/send/components/css/Breakdown.css';
import Amount from '../../../../components/send/components/entry_types/Amount';
import { NEAR_ID, NEAR_DECIMALS } from '../../../../config';
import { useSwapData } from '../../model/Swap';
import PriceImpact from '../PriceImpact';
import SlippagePicker from './SlippagePicker';

const RowWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 15px;
    color: #72727a;

    span {
        display: flex;
    }

    .tooltip {
        width: 0.938rem;
    }
`;

const SwapFeeDetails = styled.div`
    display: flex;
    flex-wrap: wrap;

    span:not(:first-child) {
        margin-left: 0.3rem;
    }
`;

const slippageMarks = [0.5, 1, 3];

export default function FtSwapDetails({
    minAmountOut,
    swapFeeAmount,
    estimatedFee,
}) {
    const {
        swapState: { tokenIn, tokenOut, swapFee, priceImpactPercent, slippage },
        events: { setSlippage },
    } = useSwapData();

    // Init default slippage value
    useEffect(() => {
        setSlippage(slippageMarks[1]);
    }, []);

    const [open, setOpen] = useState(false);

    const toggleDetailsView = () => setOpen((view) => !view);

    return (
        <Breakdown
            className={`transaction-details-breakdown ${open ? 'open' : ''}`}
        >
            <Accordion
                trigger='transaction-details-breakdown'
                className='breakdown'
            >
                <SlippagePicker
                    value={slippage}
                    setSlippage={setSlippage}
                    marks={slippageMarks}
                />
                <RowWrapper>
                    <span>
                        <Translate id='swap.priceImpact' />
                        <Tooltip translate='swap.translateIdInfoTooltip.priceImpact' />
                    </span>
                    <PriceImpact percent={priceImpactPercent || 0} />
                </RowWrapper>

                {swapFee && (
                    <RowWrapper>
                        <span>
                            <Translate id='swap.swapFee' />
                            <Tooltip translate='swap.translateIdInfoTooltip.swapFee' />
                        </span>
                        <SwapFeeDetails>
                            <span>{swapFee} %</span>
                            {swapFeeAmount ? (
                                <span>
                                    / {swapFeeAmount}{' '}
                                    {
                                        tokenIn.onChainFTMetadata
                                            ?.symbol
                                    }
                                </span>
                            ) : (
                                ''
                            )}
                        </SwapFeeDetails>
                    </RowWrapper>
                )}

                {estimatedFee && (
                    <Amount
                        className='details-info'
                        translateIdTitle='swap.fee'
                        amount={estimatedFee}
                        symbol={NEAR_ID}
                        decimals={NEAR_DECIMALS}
                        translateIdInfoTooltip='swap.translateIdInfoTooltip.fee'
                        isApproximate
                    />
                )}

                <Amount
                    className='details-info'
                    translateIdTitle='swap.minReceived'
                    amount={minAmountOut}
                    symbol={tokenOut.onChainFTMetadata?.symbol}
                    decimals={0}
                    translateIdInfoTooltip='swap.translateIdInfoTooltip.minimumReceived'
                />
            </Accordion>
            <AccordionTrigger
                id='transaction-details-breakdown'
                translateIdTitle='sendV2.accordionTriggerTitle.transactionDetails'
                open={open}
                onClick={toggleDetailsView}
            />
        </Breakdown>
    );
}
