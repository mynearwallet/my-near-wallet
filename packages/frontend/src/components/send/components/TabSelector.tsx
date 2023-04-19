import React from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import { redirectTo } from "../../../redux/actions/account";
import { SHOW_NETWORK_BANNER } from "../../../utils/wallet";
import { useTranslation } from "react-i18next";

const StyledContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-around;
    border: 1px solid #F0F0F1;
    border-radius: 8px;
    overflow: hidden;

    > div {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #F0F0F1;
        color: #A2A2A8;
        font-weight: 600;
        padding: 15px;
        cursor: pointer;
        font-size: 16px;
        transition: color 100ms;
        min-height: 56px;

        &:not(.active) {
            :hover {
                color: black;
            }
        }

        &.active {
            background-color: white;
            color: #0072CE;
            cursor: default;
        }
    }

    @media (max-width: 500px) {
        margin: -36px -14px 0 -14px;
        border-radius: 0;
        border-bottom: 0;

        &.showing-banner {
            margin: -45px -14px 0 -14px;
        }
    }
`;

export const TabSelector: React.FunctionComponent = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const pathname = location.pathname;
  const sendMoneyRoute = "/send-money";
  const receiveMoneyRoute = "/receive-money";
  const { t } = useTranslation();

  //TODO: Replace tab selector in Wallet.js with this component

  return (
    <StyledContainer className={SHOW_NETWORK_BANNER ? "showing-banner" : ""}>
      {/* rome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <div
        role='button'
        className={pathname.includes(sendMoneyRoute) ? "active" : ""}
        onClick={
          !pathname.includes(sendMoneyRoute) ? () => dispatch(redirectTo(sendMoneyRoute)) : null
        }
      >
        {t("button.send")}
      </div>
      {/* rome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <div
        role='button'
        className={pathname.includes(receiveMoneyRoute) ? "active" : ""}
        onClick={
          !pathname.includes(receiveMoneyRoute)
            ? () => dispatch(redirectTo(receiveMoneyRoute))
            : null
        }
      >
        {t("button.receive")}
      </div>
    </StyledContainer>
  );
};
