import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import {
    meteorNetworkId,
    promptMeteorAccountTransfer,
    startMeteorNewKeyAccountTransfer,
} from '../../services/meteorConnect';
import Container from '../common/styled/Container.css';
import MeteorConnectIcon from '../svg/MeteorConnectIcon';
import exportManualIcon from '../svg/Vector.svg';
import {
    loadExportAccountSecrets,
    loadNewKeyTransferAccounts,
} from './accountExportAccounts';
import { saveAccountExportSuccess } from './accountExportSuccessState';

const ExportMethodPage = styled(Container)`
    &.method-page {
        max-width: 900px;
    }

    &&& {
        h1,
        h2 {
            text-align: center !important;
        }
    }
`;

const MethodList = styled.div`
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: 56px;

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
    }
`;

const MethodButton = styled.button`
    align-items: center;
    border: 0;
    border-radius: 16px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 280px;
    padding: 32px;
    text-align: center;
    transition: transform 150ms, box-shadow 150ms;

    &:hover:not(:disabled) {
        box-shadow: 0 8px 20px rgb(36 39 42 / 15%);
        transform: translateY(-2px);
    }

    &:disabled {
        cursor: wait;
        opacity: 0.75;
    }

    .method-icon-slot {
        align-items: center;
        display: flex;
        height: 65px;
        justify-content: center;
        margin-bottom: 24px;
        width: 68px;
    }

    .method-icon {
        display: block;
        flex: none;
        object-fit: contain;
        overflow: visible;
    }

    .meteor-connect-icon {
        height: 65px;
        width: 68px;
    }

    .manual-export-icon {
        height: 65px;
        width: 68px;
    }

    .method-title {
        font-size: 20px;
        font-weight: 700;
        line-height: 26px;
    }

    .method-description {
        font-size: 14px;
        line-height: 21px;
        margin-top: 8px;
    }

    &.meteor-connect {
        background: #5380f5;
        color: #fff;
    }

    &.manual-export {
        background: #f0f4ff;
        color: #5380f5;

        .method-icon {
            color: #5380f5;
        }
    }
`;

const ErrorMessage = styled.p`
    color: #dc1f25;
    margin: 20px 0 0;
    text-align: center;
`;

export default function AccountExportMethod() {
    const { t } = useTranslation();
    const history = useHistory();
    const location = useLocation();
    const accountIds = location.state?.accountIds;
    const [isExporting, setIsExporting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState('mobile');
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            history.replace('/export-accounts/select');
        }
    }, [accountIds, history]);

    const handleNewKeyTransfer = async () => {
        setIsExporting(true);
        setErrorMessage('');
        try {
            const accounts = await loadNewKeyTransferAccounts(accountIds);
            const session = await startMeteorNewKeyAccountTransfer({
                accounts,
                networkId: meteorNetworkId,
                targetPlatform: selectedPlatform,
            });
            history.push('/export-accounts/new-key-progress', {
                clientTransferId: session.clientTransferId,
            });
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Could not start the new-key account transfer.'
            );
            setIsExporting(false);
        }
    };

    const handleExistingSecretTransfer = async () => {
        let didNavigateToSuccess = false;

        setIsExporting(true);
        setErrorMessage('');

        try {
            const accounts = await loadExportAccountSecrets(accountIds);
            const outcome = await promptMeteorAccountTransfer({
                accounts,
                networkId: meteorNetworkId,
            });

            if (outcome.status === 'imported') {
                didNavigateToSuccess = true;
                saveAccountExportSuccess(accountIds);
                history.push('/export-accounts/success', { accountIds });
            } else if (outcome.status === 'declined') {
                setErrorMessage('The account transfer was declined in Meteor Wallet.');
            } else if (outcome.status === 'expired') {
                setErrorMessage('The account transfer expired. You can try again.');
            }
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Could not start the account transfer.'
            );
        } finally {
            if (!didNavigateToSuccess) {
                setIsExporting(false);
            }
        }
    };

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return null;
    }

    return (
        <ExportMethodPage className='method-page'>
            <div className='send-theme'>
                <h1>{t('newKeyTransfer.methodHeading')}</h1>
                <h2>{t('newKeyTransfer.methodSubheading')}</h2>
                <MethodList>
                    <MethodButton
                        as='div'
                        className='meteor-connect'
                    >
                        <span className='method-icon-slot'>
                            <MeteorConnectIcon className='method-icon meteor-connect-icon' />
                        </span>
                        <span className='method-title'>{t('newKeyTransfer.title')}</span>
                        <span className='method-description'>
                            {t('newKeyTransfer.description')}
                        </span>
                        <label>
                            <input
                                type='radio'
                                name='meteor-platform'
                                value='mobile'
                                checked={selectedPlatform === 'mobile'}
                                onChange={() => setSelectedPlatform('mobile')}
                            />{' '}
                            {t('newKeyTransfer.meteorMobile')}
                        </label>
                        <label>
                            <input
                                type='radio'
                                name='meteor-platform'
                                value='web'
                                checked={selectedPlatform === 'web'}
                                onChange={() => setSelectedPlatform('web')}
                            />{' '}
                            {t('newKeyTransfer.meteorWeb')}
                        </label>
                        <button
                            type='button'
                            disabled={isExporting}
                            onClick={() => void handleNewKeyTransfer()}
                        >
                            {t('newKeyTransfer.start')}
                        </button>
                    </MethodButton>
                    <MethodButton
                        className='manual-export'
                        disabled={isExporting}
                        onClick={() =>
                            history.push('/export-accounts/manual', { accountIds })
                        }
                    >
                        <span className='method-icon-slot'>
                            <img
                                alt=''
                                className='method-icon manual-export-icon'
                                src={exportManualIcon}
                            />
                        </span>
                        <span className='method-title'>{t('newKeyTransfer.manualTitle')}</span>
                        <span className='method-description'>
                            {t('newKeyTransfer.manualDescription')}
                        </span>
                    </MethodButton>
                </MethodList>
                <button
                    type='button'
                    disabled={isExporting}
                    onClick={() => setShowAdvanced((current) => !current)}
                >
                    {t(showAdvanced ? 'newKeyTransfer.hideAdvanced' : 'newKeyTransfer.showAdvanced')}
                </button>
                {showAdvanced && (
                    <div>
                        <p>
                            {t('newKeyTransfer.advancedDescription')}
                        </p>
                        <button
                            type='button'
                            disabled={isExporting}
                            onClick={() => void handleExistingSecretTransfer()}
                        >
                            {t('newKeyTransfer.continueExistingSecret')}
                        </button>
                    </div>
                )}
                {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
            </div>
        </ExportMethodPage>
    );
}
