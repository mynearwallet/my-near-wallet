import React from "react";
import styled from "styled-components";
import Balance from "../../../common/balance/Balance";
import FormButton from "../../../common/FormButton";
import { AmountInput } from "../AmountInput";
import { BalanceDetails } from "../BalanceDetails";
import { SelectTokenButton } from "../SelectTokenButton";
import { TabSelector } from "../TabSelector";
import { useTranslation } from "react-i18next";

const StyledContainer = styled.form`
    &&& {
        > button {
            &.light-blue {
                margin: 0 auto;
                display: block;
            }
        }

        .amount-input-wrapper {
            margin: 55px 0px 15px;
            height: 74px;
            display: flex;
            align-items: center;
        }

        .usd-amount {
            text-align: center;
            margin-bottom: 20px;
            color: #A2A2A8;
        }

        .select-token-btn {
            margin: 55px 0 5px 0;
        }
    }
`;

interface Props {
    amount: string
    rawAmount: string
    availableToSend: string
    continueAllowed: boolean
    error: string
    isMobile: boolean
    selectedToken: Wallet.Token
    onSetMaxAmount: () => void
    onContinue: (event: any) => void
    onClickCancel: () => void
    onClickSelectToken: () => void
    onChangeAmount: () => void
}

export const EnterAmount: React.FunctionComponent<Props> = ({
  amount,
  rawAmount,
  onChangeAmount,
  onSetMaxAmount,
  availableToSend,
  continueAllowed,
  onContinue,
  onClickCancel,
  selectedToken,
  onClickSelectToken,
  error,
  isMobile,
}) => {
  const { t } = useTranslation();

  return (
    <StyledContainer
      className='buttons-bottom'
      onSubmit={(e) => {
        onContinue(e);
        e.preventDefault();
      }}
      noValidate
    >
      <TabSelector />
      <div className='amount-input-wrapper'>
        <AmountInput value={amount} onChange={onChangeAmount} error={error} autoFocus={!isMobile} />
      </div>
      {selectedToken.onChainFTMetadata?.symbol === "NEAR" && (
        <div className='usd-amount'>
          <Balance amount={rawAmount} showBalanceInNEAR={false} />
        </div>
      )}
      <FormButton
        onClick={onSetMaxAmount}
        type='button'
        color='light-blue'
        className='small rounded'
      >
        {t('button.useMax')}
      </FormButton>
      <SelectTokenButton token={selectedToken} onClick={onClickSelectToken} />
      <BalanceDetails availableToSend={availableToSend} selectedToken={selectedToken} />
      <div className='buttons-bottom-buttons'>
        {/* TODO: Add error state */}
        <FormButton
          type='submit'
          disabled={!continueAllowed}
          data-test-id="sendMoneyPageSubmitAmountButton"
        >
          {t('button.continue')}
        </FormButton>
        <FormButton type='button' onClick={onClickCancel} className='link' color='gray'>
          {t('button.cancel')}
        </FormButton>
      </div>
    </StyledContainer>
  );
};
