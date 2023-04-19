import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

export type TransactionStatus = "SuccessValue" | "Failure" | "notAvailable";

const StyledContainer = styled.div`
    display: flex;
    align-items: center;
`;
const Indicator = styled.span`
    display: inline-block;
    width: 9px;
    height: 9px;
    background-color: ${(props) => props.color};
    border-radius: 50%;
    margin-right: 10px;
`;

const getStatusColor = (status: TransactionStatus) => {
  switch (status) {
    case "SuccessValue":
      return "#4DD5A6";
    case "Failure":
      return "#ff585d";
    case "notAvailable":
      return "#ff585d";
    default:
      return;
  }
};

interface Props {
  status: TransactionStatus;
}

export const TXStatus: React.FunctionComponent<Props> = ({ status }) => {
  const { t } = useTranslation();

  return (
    <StyledContainer className='status'>
      <Indicator color={getStatusColor(status)} />
      {t(`sendV2.TXEntry.status.${status}`)}
    </StyledContainer>
  );
};
