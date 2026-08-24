import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { switchAccount } from '../../redux/actions/account';
import { wallet } from '../../utils/wallet';
import FormButton from '../common/FormButton';
import Checkbox from '../common/Checkbox';
import Container from '../common/styled/Container.css';
import ExportAccountRemovalWarningIcon from '../svg/ExportAccountRemovalWarningIcon';
import AccountExportSelectedAccountList from './AccountExportSelectedAccountList';
import {
    clearAccountExportSuccess,
    getAccountExportSuccess,
} from './accountExportSuccessState';

const AccountExportRemovePage = styled(Container)`
    max-width: 500px;

    &&& {
        h1 {
            text-align: center !important;
        }
    }
`;

const WarningBox = styled.section`
    align-items: center;
    background: #ffdbdb;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    margin-bottom: 32px;
    margin-top: 28px;
    padding: 28px 24px;
    text-align: center;

    .warning-icon {
        height: 56px;
        margin-bottom: 20px;
        width: 64px;
    }

    p {
        color: #dc1f25;
        font-weight: 400;
        line-height: 22px;
        margin: 0;
    }

    p + p {
        margin-top: 14px;
    }
`;

const ConfirmationLabel = styled.label`
    align-items: flex-start;
    color: #3f4045;
    cursor: pointer;
    display: flex;
    font-size: 14px;
    gap: 12px;
    line-height: 20px;
    margin-top: 24px;

    > div {
        flex: 0 0 20px;
        margin-top: 1px;
    }

    strong {
        color: #e5484d;
        font-weight: 700;
    }
`;

const ErrorMessage = styled.p`
    color: #dc1f25;
    margin: 16px 0 0;
    text-align: center;
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

const getExistingAccountIds = (accountIds) => {
    const walletAccounts = wallet.getAccountsLocalStorage();

    return accountIds.filter((accountId) =>
        Object.prototype.hasOwnProperty.call(walletAccounts, accountId)
    );
};

export default function AccountExportRemove() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const history = useHistory();
    const location = useLocation();
    const accountIds = location.state?.accountIds || getAccountExportSuccess();
    const [hasConfirmedAccess, setHasConfirmedAccess] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            history.replace('/export-accounts/select');
        }
    }, [accountIds, history]);

    const returnToMyNearWallet = () => {
        clearAccountExportSuccess();
        history.replace('/');
    };

    const removeSelectedAccounts = async () => {
        setIsRemoving(true);
        setErrorMessage('');

        try {
            const accountIdsToRemove = getExistingAccountIds(accountIds);
            let walletAccounts = wallet.getAccountsLocalStorage();

            for (const accountId of accountIdsToRemove) {
                walletAccounts = await wallet.removeWalletAccount(accountId);
            }

            clearAccountExportSuccess();

            const remainingAccountIds = Object.keys(walletAccounts);
            if (remainingAccountIds.length === 0) {
                window.location.assign('/');
                return;
            }

            dispatch(switchAccount({ accountId: remainingAccountIds[0] }));
            history.replace('/');
        } catch {
            setErrorMessage(t('accountExport.remove.failed'));
            setIsRemoving(false);
        }
    };

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return null;
    }

    return (
        <AccountExportRemovePage className='small-centered'>
            <div className='send-theme'>
                <h1>{t('accountExport.remove.title')}</h1>
                <WarningBox>
                    <ExportAccountRemovalWarningIcon className='warning-icon' />
                    <p>{t('accountExport.remove.warningConfirmFirst')}</p>
                    <p>{t('accountExport.remove.warningPermanent')}</p>
                </WarningBox>
                <AccountExportSelectedAccountList
                    accountIds={accountIds}
                    title={t('accountExport.remove.listTitle')}
                />
                <ConfirmationLabel>
                    <Checkbox
                        checked={hasConfirmedAccess}
                        onChange={(event) => setHasConfirmedAccess(event.target.checked)}
                    />
                    <span>{t('accountExport.remove.confirmAccess')}</span>
                </ConfirmationLabel>
                {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
                <Buttons>
                    <FormButton
                        color='red'
                        disabled={!hasConfirmedAccess || isRemoving}
                        onClick={() => void removeSelectedAccounts()}
                    >
                        {t(
                            isRemoving
                                ? 'accountExport.remove.removing'
                                : 'accountExport.remove.removeSelected'
                        )}
                    </FormButton>
                    <div className='return-to-wallet'>
                        <FormButton
                            className='link'
                            color='gray'
                            disabled={isRemoving}
                            onClick={returnToMyNearWallet}
                        >
                            {t('accountExport.returnToWallet')}
                        </FormButton>
                    </div>
                </Buttons>
            </div>
        </AccountExportRemovePage>
    );
}
