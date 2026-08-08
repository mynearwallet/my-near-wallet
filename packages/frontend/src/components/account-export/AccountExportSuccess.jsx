import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';
import ExportAccountSelectedIcon from '../svg/ExportAccountSelectedIcon';
import {
    clearAccountExportSuccess,
    getAccountExportSuccess,
} from './accountExportSuccessState';

const AccountExportSuccessPage = styled(Container)`
    max-width: 500px;

    &&& {
        h1,
        h2 {
            text-align: center !important;
        }
    }
`;

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

const Buttons = styled.div`
    margin-top: 48px;

    > button {
        margin-top: 14px;
        width: 100%;
    }
`;

export default function AccountExportSuccess() {
    const history = useHistory();
    const location = useLocation();
    const accountIds = location.state?.accountIds || getAccountExportSuccess();

    useEffect(() => {
        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            history.replace('/export-accounts/select');
        }
    }, [accountIds, history]);

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return null;
    }

    return (
        <AccountExportSuccessPage className='small-centered'>
            <div className='send-theme'>
                <h1>Accounts Exported Successfully</h1>
                <h2>
                    Your selected accounts have been securely exported and imported into
                    Meteor Wallet.
                </h2>
                <AccountSection>
                    <AccountSectionTitle>Exported Accounts</AccountSectionTitle>
                    {accountIds.map((accountId) => (
                        <AccountRow key={accountId}>
                            <span className='account-id'>{accountId}</span>
                            <ExportAccountSelectedIcon className='selection-indicator' />
                        </AccountRow>
                    ))}
                </AccountSection>
                <Buttons>
                    <FormButton
                        onClick={() => {
                            clearAccountExportSuccess();
                            history.replace('/');
                        }}
                    >
                        Return to MyNearWallet
                    </FormButton>
                </Buttons>
            </div>
        </AccountExportSuccessPage>
    );
}
