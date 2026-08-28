import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import {
    archiveMeteorNewKeyFencedOperation,
    getMeteorNewKeyReconciliationReport,
    reconcileMeteorNewKeyFencedOperation,
    removeMeteorNewKeyDestinationKey,
} from '../../services/meteorConnect';
import { describeNewKeyTransferError } from '../../services/newKeyTransferState';
import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';
import ExportAccountUnavailableIcon from '../svg/ExportAccountUnavailableIcon';
import {
    trackMigrationRecoveryArchiveFailed,
    trackMigrationRecoveryArchiveRequested,
    trackMigrationRecoveryArchiveSucceeded,
    trackMigrationRecoveryCheckFailed,
    trackMigrationRecoveryCheckFinished,
    trackMigrationRecoveryCheckRequested,
    trackMigrationRecoveryFinishLater,
    trackMigrationRecoveryReportFailed,
    trackMigrationRecoveryReportLoaded,
    trackMigrationRecoveryResolved,
    trackMigrationRecoveryRevokeFailed,
    trackMigrationRecoveryRevokeRequested,
    trackMigrationRecoveryRevokeSucceeded,
} from './accountExportAnalytics';

/**
 * Resolve a transfer this device is fenced on.
 *
 * A signed AddKey whose start-result record was lost cannot be resumed (nothing binds it) and
 * cannot be discarded (the bytes may still land on-chain). Before this screen existed, both routes
 * refused and the error copy pointed at a support reference that was never rendered — the profile
 * was simply stuck (REVIEW-consumer-implementation B-04).
 *
 * Every decision here belongs to the SDK's state machine. This screen shows what it found, offers
 * only the step that state actually permits, and never suggests starting again — the global fence
 * guarantees a fresh start would be refused, so offering it only wastes the user's time.
 */

const RecoveryPage = styled(Container)`
    max-width: 560px;

    &&& {
        h1,
        h2 {
            text-align: center !important;
        }
    }
`;

const Explainer = styled.p`
    color: #72727a;
    font-size: 14px;
    line-height: 20px;
    margin: 24px 0 0;
    text-align: center;
`;

const SupportReference = styled.div`
    align-items: center;
    background: #f8f8f8;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 20px;
    padding: 15px;
    text-align: center;

    .label {
        color: #72727a;
        font-size: 12px;
        line-height: 18px;
    }

    .reference {
        font-family: monospace;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 0.04em;
        line-height: 22px;
        overflow-wrap: anywhere;
        user-select: all;
    }
`;

const OperationCard = styled.section`
    background: #fff6f6;
    border-radius: 8px;
    margin-top: 20px;
    padding: 15px;

    .heading {
        align-items: flex-start;
        display: flex;
        gap: 12px;
    }

    .icon {
        flex: 0 0 20px;
        height: 20px;
        width: 20px;
    }

    .account-id {
        font-size: 16px;
        font-weight: 600;
        line-height: 20px;
        overflow-wrap: anywhere;
        word-break: break-word;
    }

    .network {
        color: #72727a;
        font-size: 12px;
        line-height: 18px;
        margin-top: 2px;
    }

    dl {
        display: grid;
        gap: 4px 12px;
        grid-template-columns: auto 1fr;
        margin: 12px 0 0;
    }

    dt {
        color: #72727a;
        font-size: 12px;
        line-height: 18px;
    }

    dd {
        font-family: monospace;
        font-size: 12px;
        line-height: 18px;
        margin: 0;
        overflow-wrap: anywhere;
        word-break: break-all;
    }

    .status {
        color: #72727a;
        font-size: 14px;
        line-height: 20px;
        margin-top: 12px;
    }

    .actions {
        margin-top: 12px;

        > button {
            width: 100%;
        }

        > button + button {
            margin-top: 8px;
        }
    }
`;

const Buttons = styled.div`
    margin-top: 32px;
    text-align: center;

    > button {
        width: 100%;
    }
`;

const ErrorMessage = styled.p`
    color: #dc1f25;
    margin: 20px 0 0;
    text-align: center;
`;

const operationKey = (operation) =>
    `${operation.transferSessionId}::${operation.networkId}::${operation.accountId}`;

export default function AccountExportNewKeyRecovery() {
    const { t } = useTranslation();
    const history = useHistory();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    /** Per-operation: the last SDK status, and whether a step is in flight. */
    const [operationState, setOperationState] = useState({});
    const attempts = useRef({});
    const didTrackResolved = useRef(false);

    const nextAttempt = (operation, action) => {
        const key = `${operationKey(operation)}::${action}`;
        attempts.current[key] = (attempts.current[key] || 0) + 1;
        return attempts.current[key];
    };

    const reload = useCallback(async () => {
        const startedAt = Date.now();
        setIsLoading(true);
        try {
            const nextReport = await getMeteorNewKeyReconciliationReport();
            setReport(nextReport);
            trackMigrationRecoveryReportLoaded({
                report: nextReport,
                durationMs: Date.now() - startedAt,
            });
            setErrorMessage('');
        } catch (error) {
            trackMigrationRecoveryReportFailed({
                error,
                durationMs: Date.now() - startedAt,
            });
            const { i18nKey, fallback } = describeNewKeyTransferError(error);
            setErrorMessage(i18nKey ? t(i18nKey) : fallback);
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        void reload();
    }, [reload]);

    useEffect(() => {
        if (report?.fenced === false && !didTrackResolved.current) {
            didTrackResolved.current = true;
            trackMigrationRecoveryResolved();
        }
    }, [report]);

    const updateOperation = (operation, patch) =>
        setOperationState((state) => ({
            ...state,
            [operationKey(operation)]: { ...state[operationKey(operation)], ...patch },
        }));

    /** One pass of the SDK state machine. Reads the chain; never signs and never broadcasts. */
    const checkOperation = async (operation) => {
        const attemptNumber = nextAttempt(operation, 'check');
        const startedAt = Date.now();
        trackMigrationRecoveryCheckRequested({ operation, attemptNumber });
        updateOperation(operation, { isBusy: true, error: '' });
        try {
            const result = await reconcileMeteorNewKeyFencedOperation(operation);
            trackMigrationRecoveryCheckFinished({
                operation,
                result,
                attemptNumber,
                durationMs: Date.now() - startedAt,
            });
            updateOperation(operation, { status: result.status, detail: result.detail });
            // A resolved operation may have lifted the whole fence.
            if (result.status === 'finalized' || result.status === 'not_found') {
                await reload();
            }
        } catch (error) {
            trackMigrationRecoveryCheckFailed({
                operation,
                error,
                attemptNumber,
                durationMs: Date.now() - startedAt,
            });
            const { i18nKey, fallback } = describeNewKeyTransferError(error);
            updateOperation(operation, { error: i18nKey ? t(i18nKey) : fallback });
        } finally {
            updateOperation(operation, { isBusy: false });
        }
    };

    /**
     * Remove the destination key with the account's own SOURCE key, then let the SDK re-prove it
     * is gone before retiring the record. The archive step is deliberately not optimistic: if
     * finality has not caught up, it refuses and the user tries again.
     */
    const revokeAndArchive = async (operation) => {
        const revokeAttempt = nextAttempt(operation, 'revoke');
        const revokeStartedAt = Date.now();
        let archiveAttempt;
        let archiveStartedAt;
        let action = 'revoke';
        trackMigrationRecoveryRevokeRequested({
            operation,
            attemptNumber: revokeAttempt,
        });
        updateOperation(operation, { isBusy: true, error: '' });
        try {
            await removeMeteorNewKeyDestinationKey(operation);
            trackMigrationRecoveryRevokeSucceeded({
                operation,
                attemptNumber: revokeAttempt,
                durationMs: Date.now() - revokeStartedAt,
            });
            action = 'archive';
            archiveAttempt = nextAttempt(operation, 'archive');
            archiveStartedAt = Date.now();
            trackMigrationRecoveryArchiveRequested({
                operation,
                attemptNumber: archiveAttempt,
            });
            const archived = await archiveMeteorNewKeyFencedOperation(operation);
            if (!archived) {
                trackMigrationRecoveryArchiveFailed({
                    operation,
                    errorCode: 'archive_refused',
                    attemptNumber: archiveAttempt,
                    durationMs: Date.now() - archiveStartedAt,
                });
                updateOperation(operation, {
                    error: t('newKeyTransfer.recovery.archiveRefused'),
                });
                return;
            }
            trackMigrationRecoveryArchiveSucceeded({
                operation,
                attemptNumber: archiveAttempt,
                durationMs: Date.now() - archiveStartedAt,
            });
            await reload();
        } catch (error) {
            if (action === 'archive') {
                trackMigrationRecoveryArchiveFailed({
                    operation,
                    error,
                    attemptNumber: archiveAttempt,
                    durationMs: Date.now() - archiveStartedAt,
                });
            } else {
                trackMigrationRecoveryRevokeFailed({
                    operation,
                    error,
                    attemptNumber: revokeAttempt,
                    durationMs: Date.now() - revokeStartedAt,
                });
            }
            const { i18nKey, fallback } = describeNewKeyTransferError(error);
            updateOperation(operation, { error: i18nKey ? t(i18nKey) : fallback });
        } finally {
            updateOperation(operation, { isBusy: false });
        }
    };

    /** The transaction can never land and the key is not there: retire the record. */
    const archiveOperation = async (operation) => {
        const attemptNumber = nextAttempt(operation, 'archive');
        const startedAt = Date.now();
        trackMigrationRecoveryArchiveRequested({ operation, attemptNumber });
        updateOperation(operation, { isBusy: true, error: '' });
        try {
            const archived = await archiveMeteorNewKeyFencedOperation(operation);
            if (!archived) {
                trackMigrationRecoveryArchiveFailed({
                    operation,
                    errorCode: 'archive_refused',
                    attemptNumber,
                    durationMs: Date.now() - startedAt,
                });
                updateOperation(operation, {
                    error: t('newKeyTransfer.recovery.archiveRefused'),
                });
                return;
            }
            trackMigrationRecoveryArchiveSucceeded({
                operation,
                attemptNumber,
                durationMs: Date.now() - startedAt,
            });
            await reload();
        } catch (error) {
            trackMigrationRecoveryArchiveFailed({
                operation,
                error,
                attemptNumber,
                durationMs: Date.now() - startedAt,
            });
            const { i18nKey, fallback } = describeNewKeyTransferError(error);
            updateOperation(operation, { error: i18nKey ? t(i18nKey) : fallback });
        } finally {
            updateOperation(operation, { isBusy: false });
        }
    };

    if (isLoading) {
        return (
            <RecoveryPage className='small-centered'>
                <div className='send-theme'>
                    <h1>{t('newKeyTransfer.recovery.title')}</h1>
                    <h2>{t('newKeyTransfer.loading')}</h2>
                </div>
            </RecoveryPage>
        );
    }

    if (report != null && !report.fenced) {
        return (
            <RecoveryPage className='small-centered'>
                <div className='send-theme'>
                    <h1>{t('newKeyTransfer.recovery.resolvedTitle')}</h1>
                    <h2>{t('newKeyTransfer.recovery.resolvedSubtitle')}</h2>
                    <Buttons>
                        <FormButton
                            onClick={() => history.replace('/export-accounts/select')}
                        >
                            {t('newKeyTransfer.recovery.continue')}
                        </FormButton>
                    </Buttons>
                </div>
            </RecoveryPage>
        );
    }

    const operations = report?.operations ?? [];

    return (
        <RecoveryPage className='small-centered'>
            <div className='send-theme'>
                <h1>{t('newKeyTransfer.recovery.title')}</h1>
                <h2>{t('newKeyTransfer.recovery.subtitle')}</h2>

                {report?.reason === 'journal_unreadable' && (
                    <Explainer>
                        {t('newKeyTransfer.recovery.journalUnreadable')}
                    </Explainer>
                )}

                {report?.supportReference && (
                    <SupportReference>
                        <span className='label'>
                            {t('newKeyTransfer.recovery.supportReferenceLabel')}
                        </span>
                        <span className='reference'>{report.supportReference}</span>
                    </SupportReference>
                )}

                {operations.map((operation) => {
                    const state = operationState[operationKey(operation)] ?? {};
                    return (
                        <OperationCard key={operationKey(operation)}>
                            <div className='heading'>
                                <ExportAccountUnavailableIcon className='icon' />
                                <div>
                                    <div className='account-id'>
                                        {operation.accountId}
                                    </div>
                                    <div className='network'>{operation.networkId}</div>
                                </div>
                            </div>
                            <dl>
                                <dt>{t('newKeyTransfer.recovery.fieldTransaction')}</dt>
                                <dd>{operation.transactionHash}</dd>
                                <dt>
                                    {t('newKeyTransfer.recovery.fieldDestinationKey')}
                                </dt>
                                <dd>{operation.destinationPublicKey}</dd>
                                <dt>{t('newKeyTransfer.recovery.fieldSourceKey')}</dt>
                                <dd>{operation.sourcePublicKey}</dd>
                            </dl>

                            <p className='status'>
                                {state.status == null
                                    ? t('newKeyTransfer.recovery.statusUnchecked')
                                    : t(`newKeyTransfer.recovery.status.${state.status}`)}
                            </p>
                            {state.status === 'ambiguous' && state.detail && (
                                <p className='status'>
                                    {t(`newKeyTransfer.recovery.detail.${state.detail}`)}
                                </p>
                            )}
                            {state.error && <ErrorMessage>{state.error}</ErrorMessage>}

                            <div className='actions'>
                                <FormButton
                                    disabled={state.isBusy}
                                    onClick={() => void checkOperation(operation)}
                                >
                                    {t('newKeyTransfer.recovery.check')}
                                </FormButton>
                                {state.status === 'destination_key_present_unproven' && (
                                    <FormButton
                                        color='red'
                                        disabled={state.isBusy}
                                        onClick={() => void revokeAndArchive(operation)}
                                    >
                                        {t('newKeyTransfer.recovery.removeKey')}
                                    </FormButton>
                                )}
                                {state.status === 'destination_key_absent' && (
                                    <FormButton
                                        disabled={state.isBusy}
                                        onClick={() => void archiveOperation(operation)}
                                    >
                                        {t('newKeyTransfer.recovery.archive')}
                                    </FormButton>
                                )}
                            </div>
                        </OperationCard>
                    );
                })}

                {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

                <Explainer>{t('newKeyTransfer.recovery.supportExplainer')}</Explainer>

                <Buttons>
                    <FormButton
                        className='link'
                        color='gray'
                        onClick={() => {
                            trackMigrationRecoveryFinishLater({
                                operationCount: operations.length,
                            });
                            history.replace('/');
                        }}
                    >
                        {t('newKeyTransfer.recovery.finishLater')}
                    </FormButton>
                </Buttons>
            </div>
        </RecoveryPage>
    );
}
