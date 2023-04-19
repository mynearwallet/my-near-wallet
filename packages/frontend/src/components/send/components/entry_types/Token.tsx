import React from "react";
import TokenIcon from "../../../common/token/TokenIcon";
import StyledContainer from "./css/Style.css";
import { useTranslation } from "react-i18next";

type Props = {
    symbol: string
    icon: string
    translateIdTitle: string
    onClick?: () => void
}

export const Token: React.FunctionComponent<Props> = ({ symbol, icon, translateIdTitle, onClick }) => {
  /* TODO: Handle long Tokens */
  const { t } = useTranslation()

  return (
    <StyledContainer className={onClick ? "clickable" : ""} onClick={onClick}>
      {translateIdTitle && t(translateIdTitle)}
      <div className='icon'>
        <span>
          <TokenIcon symbol={symbol} icon={icon} />
        </span>
        {symbol}
      </div>
    </StyledContainer>
  );
};
