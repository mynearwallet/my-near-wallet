import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';
import AccountExportSelectedAccountList from './AccountExportSelectedAccountList';
import useNewKeyTransfer from './useNewKeyTransfer';

const ActivatedPage = styled(Container)`
    max-width: 500px;

    &&& {
        h1,
        h2 {
            text-align: center !important;
        }
    }
`;

const UnconfirmedSection = styled.section`
    background: #fff6f6;
    border-radius: 8px;
    margin-top: 20px;
    padding: 15px;

    .section-title {
        color: #72727a;
        font-size: 14px;
        line-height: 20px;
        margin: 0 0 10px;
    }

    .account-id {
        background: #ffe9e9;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        line-height: 20px;
        overflow-wrap: anywhere;
        padding: 15px;
        word-break: break-word;
    }

    .account-id + .account-id {
        margin-top: 8px;
    }
`;

const Buttons = styled.div`
    margin-top: 48px;
    text-align: center;

    > button {
        width: 100%;
    }

    .secondary {
        margin-top: 8px;
    }
`;

/**
 * The transfer is done: Meteor holds a proven full-access key for each confirmed account and has
 * imported it.
 *
 * Removing the account from this wallet is deliberately a separate, opt-in step — the source key
 * still works, and it is the user's only way back if anything went wrong on Meteor's side.
 */
export default function AccountExportNewKeyActivated() {
    const { t } = useTranslation();
    const history = useHistory();
    const { summary, isLoading, errorMessage } = useNewKeyTransfer({ fallback: 'latest' });

    if (isLoading || summary == null) {
        return (
            <ActivatedPage className='small-centered'>
                <div className='send-theme'>
                    <h1>{t('newKeyTransfer.activated.title')}</h1>
                    <h2>{errorMessage || t('newKeyTransfer.loading')}</h2>
                </div>
            </ActivatedPage>
        );
    }

    const confirmed = summary.accepted.filter((account) => account.isVerified);
    const unconfirmed = summary.accepted.filter((account) => !account.isVerified);

    return (
        <ActivatedPage className='small-centered'>
            <div className='send-theme'>
                <h1>{t('newKeyTransfer.activated.title')}</h1>
                <h2>{t('newKeyTransfer.activated.subtitle')}</h2>

                {confirmed.length > 0 && (
                    <AccountExportSelectedAccountList
                        accountIds={confirmed.map((account) => account.accountId)}
                        title={t('newKeyTransfer.activated.listTitle')}
                    />
                )}

                {unconfirmed.length > 0 && (
                    <UnconfirmedSection>
                        <p className='section-title'>
                            {t('newKeyTransfer.activated.unconfirmedTitle')}
                        </p>
                        {unconfirmed.map((account) => (
                            <div className='account-id' key={account.accountId}>
                                {account.accountId}
                            </div>
                        ))}
                    </UnconfirmedSection>
                )}

                <Buttons>
                    <FormButton
                        color='blue'
                        disabled={confirmed.length === 0}
                        onClick={() =>
                            history.push('/export-accounts/remove', {
                                accountIds: confirmed.map((account) => account.accountId),
                            })
                        }
                    >
                        {t('newKeyTransfer.activated.remove')}
                    </FormButton>
                    <div className='secondary'>
                        <FormButton
                            className='link'
                            color='gray'
                            onClick={() => history.replace('/')}
                        >
                            {t('newKeyTransfer.activated.keep')}
                        </FormButton>
                    </div>
                </Buttons>
            </div>
        </ActivatedPage>
    );
}
