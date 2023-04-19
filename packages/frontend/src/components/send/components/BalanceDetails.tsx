import React from "react";
import Breakdown from "./css/Breakdown.css";
import { Amount } from "./entry_types/Amount";

const prefixTXEntryTitledId = (key: string) => `sendV2.TXEntry.title.${key}`;

interface Props {
  availableToSend: string;
  selectedToken: Wallet.Token;
}

export const BalanceDetails: React.FunctionComponent<Props> = ({
  availableToSend,
  selectedToken,
}) => {
  /* TODO: Add error state */
  return (
    <Breakdown className='available-to-send-breakdown'>
      <Amount
        data-test-id="sendPageSelectedTokenBalance"
        translateIdTitle={prefixTXEntryTitledId("availableToSend")}
        amount={availableToSend}
        symbol={selectedToken.onChainFTMetadata?.symbol}
        decimals={selectedToken.onChainFTMetadata?.decimals}
      />
    </Breakdown>
  );
};
