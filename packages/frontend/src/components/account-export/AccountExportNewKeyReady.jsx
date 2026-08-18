import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';
import AccountExportSelectedAccountList from './AccountExportSelectedAccountList';

const NewKeyReadyPage = styled(Container)`
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
        width: 100%;
    }
`;

export default function AccountExportNewKeyReady() {
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
        <NewKeyReadyPage className='small-centered'>
            <div className='send-theme'>
                <h1>Meteor Keys Are Ready</h1>
                <h2>
                    Meteor Wallet has created new access keys for your selected accounts.
                    Review and activate them to continue the transfer.
                </h2>
                <AccountExportSelectedAccountList
                    accountIds={accountIds}
                    title='Accounts Ready to Activate'
                />
                <Buttons>
                    <FormButton
                        onClick={() =>
                            history.push('/export-accounts/new-key-activation', {
                                accountIds,
                            })
                        }
                    >
                        Activate New Keys
                    </FormButton>
                </Buttons>
            </div>
        </NewKeyReadyPage>
    );
}
