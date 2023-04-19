import React from "react";
import Tooltip from "../../../common/Tooltip";
import { RawTokenAmount } from "../RawTokenAmount";
import StyledContainer from "./css/Style.css";
import { useTranslation } from "react-i18next";

interface Props {
  translateIdTitle: string;
  amount: string;
  symbol?: string;
  decimals?: number;
  translateIdInfoTooltip?: string;
  isApproximate?: boolean;
  className?: string;
  "data-test-id"?: string;
}

export const Amount: React.FunctionComponent<Props> = ({
  className,
  symbol,
  amount,
  decimals,
  translateIdTitle,
  translateIdInfoTooltip,
  isApproximate,
  "data-test-id": testId,
}) => {
  const { t } = useTranslation();
  /* TODO: Handle long amounts */
  return (
    <StyledContainer className={className} data-test-id={testId}>
      {t(translateIdTitle)}
      {translateIdInfoTooltip && <Tooltip translate={translateIdInfoTooltip} />}
      <div className='amount'>
        {isApproximate && "~"}
        <RawTokenAmount
          symbol={symbol}
          amount={amount}
          decimals={decimals}
          showFiatAmountForNonNearToken={false}
        />
      </div>
    </StyledContainer>
  );
};
