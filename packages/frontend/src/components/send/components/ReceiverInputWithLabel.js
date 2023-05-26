import React, { useState } from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import classNames from '../../../utils/classNames';
import InputAccountId from './InputAccountId';

const StyledContainer = styled.div`
    background-color: #fafafa;
    border: 2px solid #fafafa;
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
        box-shadow: 0 0 0 2pt #c8e3fc;
    }

    &.problem {
        border: 2px solid #ff585d;
        background-color: white;

        &.focus {
            box-shadow: 0px 0px 0px 2pt #ffbdbe;
        }
    }

    &.success {
        border: 2px solid #00c08b;
        background-color: white;

        &.focus {
            box-shadow: 0px 0px 0px 2pt #c5ffef;
        }
    }
`;

const ReceiverInputWithLabel = ({
    receiverId,
    handleChangeReceiverId,
    checkAccountAvailable,
    setIsImplicitAccount,
    localAlert,
    clearLocalAlert,
    autoFocus,
    isSuccess,
    isProblem,
}) => {
    const [inputHasFocus, setInputHasFocus] = useState(false);
    // TODO: Add remaining error style text

    return (
        <StyledContainer
            className={classNames([
                { success: isSuccess },
                { problem: isProblem },
                { focus: inputHasFocus },
            ])}
        >
            <Translate id='sendV2.selectReceiver.receiverInputLabel' />
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
                autoFocus={!receiverId && autoFocus}
                isSuccess={isSuccess}
                isProblem={isProblem}
            />
        </StyledContainer>
    );
};

export default ReceiverInputWithLabel;
