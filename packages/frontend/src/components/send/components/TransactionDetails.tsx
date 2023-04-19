import React, { useState } from "react";
import classNames from "../../../utils/classNames";
import Accordion from "../../common/Accordion";
import { AccordionTrigger } from "./AccordionTrigger";
import Breakdown from "./css/Breakdown.css";
import { Amount } from "./entry_types/Amount";
import { Token } from "./entry_types/Token";

type Props = {
    selectedToken: Wallet.Token
    estimatedFeesInNear: string
    estimatedTotalInNear: string
    amount: string
    onTokenClick: () => void
}

const prefixTXEntryTitledId = (key: string) => `sendV2.TXEntry.title.${key}`;

export const TransactionDetails: React.FunctionComponent<Props> = ({
  selectedToken,
  estimatedFeesInNear,
  estimatedTotalInNear,
  amount,
  onTokenClick,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Breakdown className={classNames(["transaction-details-breakdown", open ? "open" : ""])}>
      <Token
        translateIdTitle={prefixTXEntryTitledId("token")}
        symbol={selectedToken.onChainFTMetadata?.symbol}
        icon={selectedToken.onChainFTMetadata?.icon}
        onClick={onTokenClick}
      />
      <Accordion trigger='transaction-details-breakdown' className='breakdown'>
        <Amount
          /* Always show fees in NEAR */
          translateIdTitle={prefixTXEntryTitledId("estimatedFees")}
          amount={estimatedFeesInNear}
          symbol='NEAR'
          translateIdInfoTooltip='sendV2.translateIdInfoTooltip.estimatedFees'
        />
        {selectedToken.onChainFTMetadata?.symbol === "NEAR" ? (
          /* Show 'Estimated total' (amount + fees) when sending NEAR only */ <Amount
            translateIdTitle={prefixTXEntryTitledId("estimatedTotal")}
            amount={estimatedTotalInNear}
            symbol='NEAR'
            translateIdInfoTooltip='sendV2.translateIdInfoTooltip.estimatedTotal'
          />
        ) : (
          /* Show 'Amount' when sending non-NEAR token only */ <Amount
            translateIdTitle={prefixTXEntryTitledId("amount")}
            amount={amount}
            symbol={selectedToken.onChainFTMetadata?.symbol}
            decimals={selectedToken.onChainFTMetadata?.decimals}
          />
        )}
      </Accordion>
      <AccordionTrigger
        id='transaction-details-breakdown'
        translateIdTitle='sendV2.accordionTriggerTitle.transactionDetails'
        open={open}
        onClick={() => setOpen(!open)}
      />
    </Breakdown>
  );
};
