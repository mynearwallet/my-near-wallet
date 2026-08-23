import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import CONFIG from '../../config';
import {
    meteorNetworkId,
    promptMeteorAccountTransfer,
    startMeteorNewKeyAccountTransfer,
} from '../../services/meteorConnect';
import {
    describeNewKeyTransferError,
    newKeyTransferEligibilityKey,
} from '../../services/newKeyTransferState';
import Checkbox from '../common/Checkbox';
import FormButton from '../common/FormButton';
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

    .method-status {
        font-size: 14px;
        line-height: 21px;
        margin-top: 20px;
        opacity: 0.85;
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

const DevTarget = styled.label`
    align-items: center;
    color: #72727a;
    cursor: pointer;
    display: flex;
    font-size: 13px;
    gap: 10px;
    justify-content: center;
    line-height: 20px;
    margin-top: 24px;

    > div {
        flex: 0 0 20px;
    }
`;

const Advanced = styled.div`
    margin-top: 40px;
    text-align: center;

    .advanced-description {
        color: #72727a;
        font-size: 13px;
        line-height: 20px;
        margin: 16px auto 0;
        max-width: 520px;
    }

    .advanced-action {
        margin-top: 12px;
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
    /**
     * Meteor Wallet V1 (the web wallet) is the only supported destination for now, so there is no
     * platform to choose. A development build may retarget the link at a locally served wallet.
     */
    const [useLocalDevWallet, setUseLocalDevWallet] = useState(false);
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
                targetPlatform: useLocalDevWallet ? 'web_local_dev' : 'web',
            });
            // Meteor has answered and its destination keys are journaled; which accounts it
            // accepted is read from the session on the next screen, not passed through history.
            history.push('/export-accounts/new-key-ready', {
                clientTransferId: session.clientTransferId,
            });
        } catch (error) {
            if (error?.availability != null) {
                // Local eligibility, decided before Meteor was asked anything — name the account
                // and the actual reason rather than a generic transfer failure.
                setErrorMessage(
                    t('newKeyTransfer.ineligible', {
                        accountId: error.accountId,
                        reason: t(newKeyTransferEligibilityKey(error.availability)),
                    })
                );
            } else {
                const { i18nKey, fallback } = describeNewKeyTransferError(error);
                setErrorMessage(
                    i18nKey ? t(i18nKey) : fallback || t('newKeyTransfer.genericError')
                );
            }
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
                        className='meteor-connect'
                        disabled={isExporting}
                        onClick={() => void handleNewKeyTransfer()}
                    >
                        <span className='method-icon-slot'>
                            <MeteorConnectIcon className='method-icon meteor-connect-icon' />
                        </span>
                        <span className='method-title'>{t('newKeyTransfer.title')}</span>
                        <span className='method-description'>
                            {t('newKeyTransfer.description')}
                        </span>
                        {isExporting && (
                            <span className='method-status'>
                                {t('newKeyTransfer.starting')}
                            </span>
                        )}
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
                        <span className='method-title'>
                            {t('newKeyTransfer.manualTitle')}
                        </span>
                        <span className='method-description'>
                            {t('newKeyTransfer.manualDescription')}
                        </span>
                    </MethodButton>
                </MethodList>

                {CONFIG.IS_DEVELOPMENT && (
                    <DevTarget>
                        <Checkbox
                            checked={useLocalDevWallet}
                            disabled={isExporting}
                            onChange={(event) =>
                                setUseLocalDevWallet(event.target.checked)
                            }
                        />
                        <span>{t('newKeyTransfer.localDevTarget')}</span>
                    </DevTarget>
                )}

                {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

                <Advanced>
                    <FormButton
                        className='link'
                        color='gray'
                        disabled={isExporting}
                        onClick={() => setShowAdvanced((current) => !current)}
                    >
                        {t(
                            showAdvanced
                                ? 'newKeyTransfer.hideAdvanced'
                                : 'newKeyTransfer.showAdvanced'
                        )}
                    </FormButton>
                    {showAdvanced && (
                        <>
                            <p className='advanced-description'>
                                {t('newKeyTransfer.advancedDescription')}
                            </p>
                            <div className='advanced-action'>
                                <FormButton
                                    color='gray'
                                    disabled={isExporting}
                                    onClick={() => void handleExistingSecretTransfer()}
                                >
                                    {t('newKeyTransfer.continueExistingSecret')}
                                </FormButton>
                            </div>
                        </>
                    )}
                </Advanced>
            </div>
        </ExportMethodPage>
    );
}
