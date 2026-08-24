import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
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
                <h1>{t('accountExport.success.title')}</h1>
                <h2>{t('accountExport.success.subtitle')}</h2>
                <AccountExportSelectedAccountList
                    accountIds={accountIds}
                    title={t('accountExport.success.listTitle')}
                />
                <Buttons>
                    <FormButton
                        color='red'
                        onClick={() => {
                            history.push('/export-accounts/remove', { accountIds });
                        }}
                    >
                        {t('accountExport.success.removeFromWallet')}
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
                            {t('accountExport.returnToWallet')}
                        </FormButton>
                    </div>
                </Buttons>
            </div>
        </AccountExportSuccessPage>
    );
}
