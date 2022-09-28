import React, { useState } from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import classNames from '../../../utils/classNames';
import Accordion from '../../common/Accordion';
import Tooltip from '../../common/Tooltip';
import AccordionTrigger from '../../send/components/AccordionTrigger';
import Breakdown from '../../send/components/css/Breakdown.css';
import Amount from '../../send/components/entry_types/Amount';
import { exchangeRateTranslation } from './helpers';
import SlippagePicker from './SlippagePicker';

const PriceImpactWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 15px;
    color: #72727A;

    span {
        display: flex;
    }
`;

const TransactionDetailsUSN = ({
    selectedTokenFrom,
    selectedTokenTo,
    amount,
    exchangeRate,
    tradingFee,
    priceImpactElement,
    setSlippage,
    feeTakenFromInput,
}) => {
    const [open, setOpen] = useState(false);

    const commissionFee = tradingFee?.toFixed(5);
    const commissionToken = feeTakenFromInput ? selectedTokenFrom : selectedTokenTo;
    const minimumReceived = exchangeRateTranslation({
        inputtedAmountOfToken: selectedTokenFrom,
        calculateAmountOfToken: selectedTokenTo,
        balance: amount,
        exchangeRate
    }) - tradingFee;

    return (
        <Breakdown
            className={classNames([
                'transaction-details-breakdown',
                open ? 'open' : '',
            ])}
        >
            <Accordion
                trigger="transaction-details-breakdown"
                className="breakdown"
            >
                <SlippagePicker
                    translateIdTitle={'swap.slippage'}
                    translateIdInfoTooltip="swap.translateIdInfoTooltip.slippage"
                    setSlippage={setSlippage}
                />
                {priceImpactElement && (
                    <PriceImpactWrapper>
                        <span>
                            <Translate id="swap.priceImpact" />
                            <Tooltip translate="swap.translateIdInfoTooltip.priceImpact" />
                        </span>
                        {priceImpactElement}
                    </PriceImpactWrapper>
                )}
                <Amount
                    className="details-info"
                    translateIdTitle={'swap.fee'}
                    amount={commissionFee.toString()}
                    symbol={commissionToken.onChainFTMetadata?.symbol}
                    decimals={0}
                    translateIdInfoTooltip="swap.translateIdInfoTooltip.fee"
                />
                <Amount
                    className="details-info"
                    translateIdTitle={'swap.minReceived'}
                    amount={minimumReceived.toString()}
                    symbol={selectedTokenTo.onChainFTMetadata?.symbol}
                    decimals={0}
                    translateIdInfoTooltip="swap.translateIdInfoTooltip.minimumReceived"
                />
            </Accordion>
            <AccordionTrigger
                id="transaction-details-breakdown"
                translateIdTitle="sendV2.accordionTriggerTitle.transactionDetails"
                open={open}
                onClick={() => setOpen(!open)}
            />
        </Breakdown>
    );
};

export default TransactionDetailsUSN;
