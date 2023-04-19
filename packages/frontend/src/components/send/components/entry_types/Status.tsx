import React from "react";
import { TXStatus, TransactionStatus } from "../TXStatus";
import StyledContainer from "./css/Style.css";
import { useTranslation } from "react-i18next";

interface Props {
  translate: string;
  status: TransactionStatus;
}

export const Status: React.FunctionComponent<Props> = ({ status, translate }) => {
  const { t } = useTranslation();

  return (
    <StyledContainer>
      {t(translate)}
      <TXStatus status={status} />
    </StyledContainer>
  );
};
