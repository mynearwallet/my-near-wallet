import React from 'react';
import styled from 'styled-components';

const StyledContainer = styled.div`
    background-color: #f0f9ff;
    border: 2px dashed #8fcdff;
    border-radius: 16px;
    padding: 16px;

    > div {
        border-radius: 8px;
        background-color: #ffffff;
        margin-bottom: 8px;
        padding: 0 16px;
        height: 52px;
        color: #72727a;
        font-weight: 700;
        display: flex;
        align-items: center;

        :first-of-type {
            justify-content: space-between;
            background-color: #c8f6e0;
            color: #005a46;

            span {
                color: #008d6a;
                font-size: 12px;
                background-color: #90e9c5;
                border-radius: 40px;
                padding: 6px 14px;
            }
        }

        :last-of-type {
            margin-bottom: 0;
        }

        > div {
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
        }
    }
`;

export default ({ newAccount, sharedAccounts }) => {
    return (
        <StyledContainer className='shared-passphrase-list'>
            <div>
                <div>{newAccount}</div> <span>New</span>
            </div>
            {sharedAccounts.map((account) => (
                <div key={account}>
                    <div>{account}</div>
                </div>
            ))}
        </StyledContainer>
    );
};
