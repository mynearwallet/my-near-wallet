import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import {
    hasPendingMeteorNewKeyStart,
    meteorNetworkId,
    startMeteorNewKeyAccountTransfer,
    startOverMeteorNewKeyTransfer,
} from '../../services/meteorConnect';
import {
    describeNewKeyTransferError,
    NEW_KEY_TRANSFER_RECOVERY_ROUTE,
    newKeyTransferEligibilityKey,
} from '../../services/newKeyTransferState';
import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';
import {
    trackMigrationActivationRequested,
    trackNewKeyPrepareFailed,
    trackNewKeyPrepareStarted,
    trackNewKeyPrepareSucceeded,
} from './accountExportAnalytics';
import { loadNewKeyTransferAccounts } from './accountExportAccounts';
import AccountExportSelectedAccountList from './AccountExportSelectedAccountList';
import NewKeyTransferProgress from './NewKeyTransferProgress';

const StartPage = styled(Container)`
    max-width: 500px;

    &&& {
        h1,
        h2 {
            text-align: center !important;
        }
    }
`;

const ErrorMessage = styled.div`
    color: #dc1f25;
    margin: 20px 0 0;
    text-align: center;
`;

const SupportCode = styled.div`
    color: #72727a;
    font-family: monospace;
    font-size: 12px;
    line-height: 18px;
    margin-top: 6px;
    overflow-wrap: anywhere;
    user-select: all;
    word-break: break-all;
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

/** Step 1A: explain the transfer and wait for a user gesture before opening Meteor Wallet. */
export default function AccountExportNewKeyStart() {
    const { t } = useTranslation();
    const history = useHistory();
    const location = useLocation();
    const accountIds = location.state?.accountIds;
    const [isStarting, setIsStarting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorCode, setErrorCode] = useState('');
    const [isFencedError, setIsFencedError] = useState(false);
    const [hasInterruptedStart, setHasInterruptedStart] = useState(() =>
        hasPendingMeteorNewKeyStart()
    );

    useEffect(() => {
        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            history.replace('/export-accounts/select');
        }
    }, [accountIds, history]);

    const resetError = () => {
        setErrorMessage('');
        setErrorCode('');
        setIsFencedError(false);
    };

    const startTransfer = async () => {
        trackNewKeyPrepareStarted(accountIds);
        setIsStarting(true);
        resetError();
        try {
            const accounts = await loadNewKeyTransferAccounts(accountIds);
            // The user chooses Meteor Web or Mobile in the SDK prompt. The resolved session
            // records that choice and the destination keys step 2 activates automatically.
            const session = await startMeteorNewKeyAccountTransfer({
                accounts,
                networkId: meteorNetworkId,
            });
            const rows = session.startOutput?.accounts || [];
            const accepted = rows.filter(({ ok }) => ok);
            const refused = rows.filter(({ ok }) => !ok);
            trackNewKeyPrepareSucceeded({
                accounts,
                accepted,
                refused,
            });

            // A resolved request can still contain only refusals. There is no step-2 work in
            // that case, so keep the user here instead of rendering an empty activation screen.
            if (accepted.length === 0) {
                setErrorMessage(t('newKeyTransfer.ready.noneSubtitle'));
                setIsStarting(false);
                return;
            }

            trackMigrationActivationRequested(accepted);
            history.replace('/export-accounts/new-key-activation', {
                clientTransferId: session.clientTransferId,
            });
        } catch (error) {
            trackNewKeyPrepareFailed({
                stage: error?.availability != null ? 'eligibility' : 'meteor_start',
                error,
            });
            if (error?.availability != null) {
                setErrorMessage(
                    t('newKeyTransfer.ineligible', {
                        accountId: error.accountId,
                        reason: t(newKeyTransferEligibilityKey(error.availability)),
                    })
                );
            } else {
                const { i18nKey, fallback, code, isFenced } =
                    describeNewKeyTransferError(error);
                setErrorMessage(
                    i18nKey ? t(i18nKey) : fallback || t('newKeyTransfer.genericError')
                );
                setErrorCode(code);
                setIsFencedError(isFenced);
            }
            setHasInterruptedStart(hasPendingMeteorNewKeyStart());
            setIsStarting(false);
        }
    };

    const discardInterruptedStart = async () => {
        setIsStarting(true);
        resetError();
        try {
            await startOverMeteorNewKeyTransfer();
            setHasInterruptedStart(false);
        } catch (error) {
            const { i18nKey, fallback, code, isFenced } =
                describeNewKeyTransferError(error);
            setErrorMessage(
                i18nKey ? t(i18nKey) : fallback || t('newKeyTransfer.genericError')
            );
            setErrorCode(code);
            setIsFencedError(isFenced);
            setHasInterruptedStart(hasPendingMeteorNewKeyStart());
        } finally {
            setIsStarting(false);
        }
    };

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return null;
    }

    return (
        <StartPage className='small-centered'>
            <div className='send-theme'>
                <NewKeyTransferProgress activeStep={1} />
                <h1>
                    {t(
                        hasInterruptedStart
                            ? 'newKeyTransfer.continueTitle'
                            : 'newKeyTransfer.title'
                    )}
                </h1>
                <h2>
                    {t(
                        hasInterruptedStart
                            ? 'newKeyTransfer.continueDescription'
                            : 'newKeyTransfer.description'
                    )}
                </h2>

                <AccountExportSelectedAccountList
                    accountIds={accountIds}
                    title={t('newKeyTransfer.selectedAccounts')}
                />

                {errorMessage && (
                    <ErrorMessage>
                        {errorMessage}
                        {errorCode && (
                            <SupportCode>
                                {t('newKeyTransfer.supportCode', { code: errorCode })}
                            </SupportCode>
                        )}
                        {isFencedError && (
                            <FormButton
                                className='link'
                                onClick={() =>
                                    history.push(NEW_KEY_TRANSFER_RECOVERY_ROUTE)
                                }
                            >
                                {t('newKeyTransfer.error.resolveNow')}
                            </FormButton>
                        )}
                    </ErrorMessage>
                )}

                <Buttons>
                    <FormButton
                        disabled={isStarting}
                        onClick={() => void startTransfer()}
                    >
                        {isStarting
                            ? t('newKeyTransfer.starting')
                            : t(
                                  hasInterruptedStart
                                      ? 'newKeyTransfer.continueTitle'
                                      : 'newKeyTransfer.start'
                              )}
                    </FormButton>
                    {hasInterruptedStart && (
                        <div className='secondary'>
                            <FormButton
                                className='link'
                                color='red'
                                disabled={isStarting}
                                onClick={() => void discardInterruptedStart()}
                            >
                                {t('newKeyTransfer.startOver.discardPending')}
                            </FormButton>
                        </div>
                    )}
                </Buttons>
            </div>
        </StartPage>
    );
}
