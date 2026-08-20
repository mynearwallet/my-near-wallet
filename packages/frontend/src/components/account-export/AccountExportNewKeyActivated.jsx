import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';
import AccountExportSelectedAccountList from './AccountExportSelectedAccountList';

const ActivatedPage = styled(Container)`
    max-width: 500px;

    &&& {
        h1,
        h2 {
            text-align: center !important;
        }
    }
`;

const Buttons = styled.div`
    margin-top: 48px;

    > button {
        margin-top: 14px;
        width: 100%;
    }
`;

export default function AccountExportNewKeyActivated() {
    const history = useHistory();
    const location = useLocation();
    const accountIds = location.state?.accountIds;

    useEffect(() => {
        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            history.replace('/export-accounts/select');
        }
    }, [accountIds, history]);

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return null;
    }

    return (
        <ActivatedPage className='small-centered'>
            <div className='send-theme'>
                <h1>Meteor Keys Activated</h1>
                <h2>
                    Your new Meteor keys have been successfully added to your accounts.
                    Return to Meteor Wallet to continue the transfer.
                </h2>
                <AccountExportSelectedAccountList
                    accountIds={accountIds}
                    title='Activated Accounts'
                />
                <Buttons>
                    <FormButton
                        color='blue'
                        onClick={() => {
                            history.push('/export-accounts/remove', { accountIds });
                        }}
                    >
                        Return to Meteor Wallet
                    </FormButton>
                </Buttons>
            </div>
        </ActivatedPage>
    );
}
