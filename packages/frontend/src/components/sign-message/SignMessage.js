import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import IconCheck from '../../images/IconCheck';
import SafeTranslate from '../SafeTranslate';
import SwapGraphic from '../svg/SwapGraphic';

const StyledContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    h3 {
        color: #272729;
        text-align: center;
        font-weight: 700;
        font-size: 24px;
        line-height: 32px;
    }

    h2 {
        font-weight: 900;
        font-size: 20px;
        color: #272729;
        text-align: center;
        line-height: 130%;
        word-break: break-word;
    }

    > .icon {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin: 32px 0 32px 0;
    }

    > .account {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;

        &.message {
            border-top: none;
            display: flex;
            align-items: flex-end;
            text-align: center;

            pre {
                background-color: lightgray;
                display: block;
                width: 100%;
                padding: 10px;
                text-align: center;
                white-space: pre-wrap;
            }
        }

        &.permissions {
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            text-align: justify;
            text-color: #272729;
            margin: 0 12px 12px 12px;
        }
    }

    .check {
        width: 32px;
        height: 32px;
        background: #d6edff;
        border-radius: 50px;
        padding-top: 3px;
        margin-right: 15px;
        svg {
            width: 26px;
            height: 26px;
        }
    }
`;

export default ({ accountId, appName, message }) => {
    return (
        <StyledContainer>
            <h3>
                <Translate id='signMessage.summary.title' />
            </h3>
            <div className='icon'>
                <SwapGraphic />
            </div>
            <h2>
                <SafeTranslate
                    id='signMessage.summary.signAMessage'
                    data={{ accountId }}
                />
            </h2>
            <div className='account message'>
                <pre>{message}</pre>
            </div>
            <div className='account permissions'>
                <div className='check'>
                    <IconCheck color='#0072CE' stroke='1.5px' rotate='180' />
                </div>
                <Translate id='signMessage.summary.permissions' />
            </div>
        </StyledContainer>
    );
};
