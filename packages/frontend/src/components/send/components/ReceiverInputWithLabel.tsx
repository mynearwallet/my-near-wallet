import React, { useState } from "react";
import styled from "styled-components";
import classNames from "../../../utils/classNames";
import InputAccountId from "./InputAccountId";
import { useTranslation } from "react-i18next";

const StyledContainer = styled.div`
    background-color: #FAFAFA;
    border: 2px solid #FAFAFA;
    display: flex;
    border-radius: 8px;
    transition: 100ms;
    color: #272729;
    font-weight: 600;
    white-space: nowrap;
    align-items: center;
    padding-left: 15px;
    margin-top: 50px;
    overflow-x: hidden;

    &.focus {
        border-color: #0072ce;
        background-color: white;
        box-shadow: 0 0 0 2pt #C8E3FC;
    }

    &.problem {
        border: 2px solid #ff585d;
        background-color: white;

        &.focus {
            box-shadow: 0px 0px 0px 2pt #FFBDBE;
        }
    }

    &.success {
        border: 2px solid #00C08B;
        background-color: white;

        &.focus {
            box-shadow: 0px 0px 0px 2pt #c5ffef;
        }
    }
`;

interface Props {
  receiverId: string;
  localAlert: string;
  isSuccess: boolean;
  isProblem: boolean;
  checkAccountAvailable: (accountId: string) => void;
  setIsImplicitAccount: () => void;
  clearLocalAlert: () => void;
  handleChangeReceiverId: () => void;
}

export const ReceiverInputWithLabel: React.FunctionComponent<Props> = ({
  receiverId,
  checkAccountAvailable,
  localAlert,
  isSuccess,
  isProblem,
  setIsImplicitAccount,
  clearLocalAlert,
  handleChangeReceiverId,
}) => {
  const [inputHasFocus, setInputHasFocus] = useState(false);
  const { t } = useTranslation();
  // TODO: Add remaining error style text

  return (
    <StyledContainer
      className={classNames([
        { success: isSuccess },
        { problem: isProblem },
        { focus: inputHasFocus },
      ])}
    >
      {t("sendV2.selectReceiver.receiverInputLabel")}
      <InputAccountId
        accountId={receiverId}
        handleChange={handleChangeReceiverId}
        ReceiverInputWithLabel={ReceiverInputWithLabel}
        checkAvailability={checkAccountAvailable}
        setIsImplicitAccount={setIsImplicitAccount}
        localAlert={localAlert}
        clearLocalAlert={clearLocalAlert}
        onFocus={() => setInputHasFocus(true)}
        onBlur={() => setInputHasFocus(false)}
        isSuccess={isSuccess}
        isProblem={isProblem}
      />
    </StyledContainer>
  );
};
