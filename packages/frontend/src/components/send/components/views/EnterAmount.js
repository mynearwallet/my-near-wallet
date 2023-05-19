import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import Balance from '../../../common/balance/Balance';
import FormButton from '../../../common/FormButton';
import Notification from '../../../common/Notification';
import AmountInput from '../AmountInput';
import BalanceDetails from '../BalanceDetails';
import SelectTokenButton from '../SelectTokenButton';
import TabSelector from '../TabSelector';

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

        .warning-message {
            margin-top: 15px;
        }
    }
`;

const EnterAmount = ({ 
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
    isMobile
}) => {
    const isBridgedToken = selectedToken?.onChainFTMetadata?.isBridged;

    return (
        <StyledContainer 
            className='buttons-bottom'
            onSubmit={(e) => {
                onContinue(e);
                e.preventDefault();
            }}
            novalidate
        >
            <TabSelector/>
            <div className='amount-input-wrapper'>
                <AmountInput
                    value={amount}
                    onChange={onChangeAmount}
                    error={error}
                    autoFocus={!isMobile}
                />
            </div>
            {selectedToken.onChainFTMetadata?.symbol === 'NEAR' && (
                <div className='usd-amount'>
                    <Balance amount={rawAmount} showBalanceInNEAR={false}/>
                </div>
            )}
            <FormButton
                onClick={onSetMaxAmount}
                type='button'
                color='light-blue'
                className='small rounded'
            >
                <Translate id='button.useMax'/>
            </FormButton>
            <SelectTokenButton
                token={selectedToken}
                onClick={onClickSelectToken}
            />
            <BalanceDetails
                availableToSend={availableToSend}
                selectedToken={selectedToken}
            />
            {isBridgedToken && (
                <div className='warning-message' data-test-id='bridge-token-warning'>
                    <Notification type='warning'>
                        <Translate id='sendV2.enterAmount.bridgedTokenWarning' />
                    </Notification>
                </div>
            )}
            <div className='buttons-bottom-buttons'>
                {/* TODO: Add error state */}
                <FormButton
                    type='submit'
                    disabled={!continueAllowed}
                    data-test-id='sendMoneyPageSubmitAmountButton'
                >
                    <Translate id='button.continue'/>
                </FormButton>
                <FormButton
                    type='button'
                    onClick={onClickCancel}
                    className='link'
                    color='gray'
                >
                    <Translate id='button.cancel'/>
                </FormButton>
            </div>
        </StyledContainer>
    );
};

export default EnterAmount;
