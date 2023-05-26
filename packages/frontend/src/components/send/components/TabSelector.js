import React from 'react';
import { Translate } from 'react-localize-redux';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { redirectTo } from '../../../redux/actions/account';
import { SHOW_NETWORK_BANNER } from '../../../utils/wallet';

const StyledContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-around;
    border: 1px solid #f0f0f1;
    border-radius: 8px;
    overflow: hidden;

    > div {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f0f0f1;
        color: #a2a2a8;
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
            color: #0072ce;
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

const TabSelector = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const pathname = location.pathname;
    const sendMoneyRoute = '/send-money';
    const receiveMoneyRoute = '/receive-money';

    //TODO: Replace tab selector in Wallet.js with this component

    return (
        <StyledContainer className={SHOW_NETWORK_BANNER ? 'showing-banner' : ''}>
            <div
                role='button'
                className={pathname.includes(sendMoneyRoute) ? 'active' : ''}
                onClick={
                    !pathname.includes(sendMoneyRoute)
                        ? () => dispatch(redirectTo(sendMoneyRoute))
                        : null
                }
            >
                <Translate id='button.send' />
            </div>
            <div
                role='button'
                className={pathname.includes(receiveMoneyRoute) ? 'active' : ''}
                onClick={
                    !pathname.includes(receiveMoneyRoute)
                        ? () => dispatch(redirectTo(receiveMoneyRoute))
                        : null
                }
            >
                <Translate id='button.receive' />
            </div>
        </StyledContainer>
    );
};

export default TabSelector;
