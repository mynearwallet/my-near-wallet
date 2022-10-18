import React, { useState } from 'react';

import Accordion from '../../../../components/common/Accordion';
import AccordionTrigger from '../../../../components/send/components/AccordionTrigger';
import Breakdown from '../../../../components/send/components/css/Breakdown.css';
import Amount from '../../../../components/send/components/entry_types/Amount';
import { NEAR_ID } from '../../../../config';
import { useSwapData } from '../../model/Swap';

export default function NearTransformationDetails({
    minAmountOut,
    estimatedFee,
}) {
    const {
        swapState: { tokenOut },
    } = useSwapData();

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
                <Amount
                    className='details-info'
                    translateIdTitle='swap.fee'
                    amount={estimatedFee}
                    symbol={NEAR_ID}
                    translateIdInfoTooltip='swap.translateIdInfoTooltip.fee'
                />
                <Amount
                    className='details-info'
                    translateIdTitle='swap.minReceived'
                    // TODO: correct formatting of amount out (multiply it here)
                    amount={minAmountOut}
                    symbol={tokenOut.onChainFTMetadata?.symbol}
                    decimals={tokenOut.onChainFTMetadata?.decimals}
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
