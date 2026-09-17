import React from 'react';
import styled from 'styled-components';

import ExportAccountSelectedIcon from '../svg/ExportAccountSelectedIcon';

const AccountSection = styled.section`
    background: #fafafa;
    border-radius: 8px;
    margin-top: 10px;
    padding: 15px;
`;

const AccountSectionTitle = styled.p`
    color: #72727a;
    font-size: 14px;
    line-height: 20px;
    margin: 0 0 10px;
`;

const AccountRow = styled.div`
    align-items: center;
    background: #f0f0f1;
    border-radius: 8px;
    display: flex;
    min-height: 54px;
    padding: 15px;

    & + & {
        margin-top: 8px;
    }

    .account-id {
        flex: 1;
        font-size: 16px;
        font-weight: 600;
        line-height: 20px;
        min-width: 0;
        overflow-wrap: anywhere;
        word-break: break-word;
    }

    .selection-indicator {
        flex: 0 0 20px;
        height: 20px;
        margin-left: 20px;
        width: 20px;
    }
`;

export default function AccountExportSelectedAccountList({ accountIds, title }) {
    return (
        <AccountSection>
            <AccountSectionTitle>{title}</AccountSectionTitle>
            {accountIds.map((accountId) => (
                <AccountRow key={accountId}>
                    <span className='account-id'>{accountId}</span>
                    <ExportAccountSelectedIcon className='selection-indicator' />
                </AccountRow>
            ))}
        </AccountSection>
    );
}
