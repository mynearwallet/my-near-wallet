import React from "react";
import Balance from "../../common/balance/Balance";
import TokenAmount from "../../common/token/TokenAmount";

interface Props {
    amount: string
    showFiatAmountForNonNearToken: boolean
    symbol?: string
    decimals?: number | null
    withSymbol?: boolean
}

export const RawTokenAmount: React.FunctionComponent<Props> = ({
  symbol,
  amount,
  decimals = null,
  withSymbol = true,
  showFiatAmountForNonNearToken,
}) => {
  if (decimals !== null && symbol) {
    return (
      <TokenAmount
        token={{
          onChainFTMetadata: {
            symbol,
            decimals
          },
          balance: amount,
        }}
        withSymbol={withSymbol}
        showFiatAmount={showFiatAmountForNonNearToken}
      />
    );
  } else {
    return <Balance amount={amount} />;
  }
};
