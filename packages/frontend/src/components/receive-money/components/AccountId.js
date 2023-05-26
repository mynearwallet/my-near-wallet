import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import ClickToCopy from '../../common/ClickToCopy';
import CopyIcon from '../../svg/CopyIcon';

const StyledContainer = styled.div`
    background-color: #fafafa;
    color: #72727a;
    padding: 15px;
    border-radius: 8px;

    .top {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .copy-account-id {
            display: flex;
            align-items: center;
            font-size: 12px;
            color: #0072ce;

            svg {
                margin-right: 4px;
                width: 16px;

                path {
                    stroke: #0072ce;
                }
            }
        }
    }

    .bottom {
        color: black;
        font-weight: 600;
        background-color: #f0f0f1;
        border-radius: 8px;
        padding: 15px;
        font-size: 16px;
        margin-top: 10px;
        word-break: break-all;
    }
`;

const AccountId = ({ accountId }) => {
    return (
        <StyledContainer>
            <div className='top'>
                <div>
                    <Translate id='input.accountId.title' />
                </div>
                <ClickToCopy copy={accountId} className='copy-account-id'>
                    <CopyIcon />
                    <Translate id='copy.title' />
                </ClickToCopy>
            </div>
            <div className='bottom'>{accountId}</div>
        </StyledContainer>
    );
};

export default AccountId;
