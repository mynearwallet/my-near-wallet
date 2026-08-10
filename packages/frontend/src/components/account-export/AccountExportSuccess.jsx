import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';
import AccountExportSelectedAccountList from './AccountExportSelectedAccountList';
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

const Buttons = styled.div`
    margin-top: 48px;

    > button {
        margin-top: 14px;
        width: 100%;
    }

    .return-to-wallet {
        margin-top: 14px;
        text-align: center;
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
                <AccountExportSelectedAccountList
                    accountIds={accountIds}
                    title='Exported Accounts'
                />
                <Buttons>
                    <FormButton
                        color='red'
                        onClick={() => {
                            history.push('/export-accounts/remove', { accountIds });
                        }}
                    >
                        Remove Exported Account from MyNearWallet
                    </FormButton>
                    <div className='return-to-wallet'>
                        <FormButton
                            className='link'
                            color='gray'
                            onClick={() => {
                                clearAccountExportSuccess();
                                history.replace('/');
                            }}
                        >
                            Return to MyNearWallet
                        </FormButton>
                    </div>
                </Buttons>
            </div>
        </AccountExportSuccessPage>
    );
}
