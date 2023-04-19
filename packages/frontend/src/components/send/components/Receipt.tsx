import React from "react";
import styled from "styled-components";
import { Amount } from "./entry_types/Amount";
import { DateAndTime } from "./entry_types/DateAndTime";
import { Receiver } from "./entry_types/Receiver";
import { Status } from "./entry_types/Status";
import { Token } from "./entry_types/Token";
import { TransactionStatus } from "./TXStatus";

const StyledContainer = styled.div`
    background-color: #FAFAFA;
    border: 1px solid #F0F0F1;
    border-radius: 8px;

    > div {
        border-bottom: 1px solid #F0F0F1;

        :last-of-type {
            border-bottom: 0;
        }
    }
`;

interface Props {
    status: TransactionStatus
    token: {
        symbol: string
        icon: string
        amount: string
        decimals: number
    }
    network_fees: string
    receiver_id: string
    block_timestamp: number
}

const prefixTXEntryTitleId = (key: string) => `sendV2.TXEntry.title.${key}`;

export const Receipt: React.FunctionComponent<Props> = ({ status, token, network_fees, receiver_id, block_timestamp }) => {
  return (
    <StyledContainer>
      <Status translate={prefixTXEntryTitleId("status")} status={status} />
      <Token
        translateIdTitle={prefixTXEntryTitleId("token")}
        symbol={token.symbol}
        icon={token.icon}
      />
      <Amount
        translateIdTitle={prefixTXEntryTitleId("amount")}
        symbol={token.symbol}
        amount={token.amount}
        decimals={token.decimals}
      />
      <Amount translateIdTitle={prefixTXEntryTitleId("networkFees")} amount={network_fees} />
      <Receiver translateIdTitle={prefixTXEntryTitleId("receiverId")} receiverId={receiver_id} />
      <DateAndTime
        translateIdTitle={prefixTXEntryTitleId("timeStamp")}
        timeStamp={block_timestamp}
      />
    </StyledContainer>
  );
};
