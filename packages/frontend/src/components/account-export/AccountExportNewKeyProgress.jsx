import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import {
    getMeteorNewKeyTransferSessions,
    reconcileMeteorNewKeyAccountTransfer,
    resumeMeteorNewKeyAccountTransfer,
    revokeMeteorNewKeyDestination,
} from '../../services/meteorConnect';
import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';

const ProgressPage = styled(Container)`
    max-width: 760px;

    .session-banner,
    .account-progress {
        background: #f4f6fb;
        border-radius: 12px;
        margin-top: 16px;
        padding: 18px;
    }

    .account-id,
    .session-id,
    .key {
        overflow-wrap: anywhere;
    }

    .account-id {
        font-weight: 700;
    }

    .status {
        color: #4d5260;
        margin-top: 8px;
    }

    .error {
        color: #c62828;
        margin-top: 8px;
    }

    .actions {
        display: grid;
        gap: 12px;
        margin-top: 28px;
    }
`;

const statusCopy = (row, t) => {
    switch (row.state) {
        case 'add_key_intent':
            return t('newKeyTransfer.progress.status.addKeyIntent');
        case 'add_key_submitted':
            return t('newKeyTransfer.progress.status.addKeySubmitted');
        case 'add_key_finalized':
        case 'verify_requested':
            return t('newKeyTransfer.progress.status.addKeyFinalized');
        case 'activation_verified':
        case 'destination_ready_source_cleanup_pending':
            return t('newKeyTransfer.progress.status.cleanupPending');
        case 'source_key_absent':
            return t('newKeyTransfer.progress.status.sourceAbsent');
        case 'local_source_cleaned':
            return t('newKeyTransfer.progress.status.localCleaned');
        default:
            return t('newKeyTransfer.progress.status.default');
    }
};

export default function AccountExportNewKeyProgress() {
    const { t } = useTranslation();
    const history = useHistory();
    const location = useLocation();
    const initialId = location.state?.clientTransferId;
    const [sessions, setSessions] = useState(() => getMeteorNewKeyTransferSessions());
    const [clientTransferId, setClientTransferId] = useState(
        initialId || sessions[sessions.length - 1]?.clientTransferId
    );
    const [isWorking, setIsWorking] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const session = useMemo(
        () => sessions.find((candidate) => candidate.clientTransferId === clientTransferId),
        [clientTransferId, sessions]
    );

    const refresh = () => setSessions(getMeteorNewKeyTransferSessions());

    useEffect(() => {
        if (!session && sessions.length === 0) {
            history.replace('/export-accounts/select');
        }
    }, [history, session, sessions.length]);

    const run = async (operation) => {
        setIsWorking(true);
        setErrorMessage('');
        try {
            await operation();
            refresh();
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : t('newKeyTransfer.progress.genericError')
            );
            refresh();
        } finally {
            setIsWorking(false);
        }
    };

    if (!session) {
        return null;
    }

    const successfulRows = session.accounts || [];
    const isComplete =
        successfulRows.length > 0 &&
        successfulRows.every((row) => row.state === 'local_source_cleaned');

    return (
        <ProgressPage className='small-centered'>
            <div className='send-theme'>
                <h1>{t(isComplete ? 'newKeyTransfer.progress.completeTitle' : 'newKeyTransfer.progress.pendingTitle')}</h1>
                <p>{t('newKeyTransfer.progress.intro')}</p>
                <div className='session-banner'>
                    <div>
                        {t('newKeyTransfer.progress.selectedWallet', { wallet: session.targetPlatform })}
                    </div>
                    <div className='session-id'>
                        {t('newKeyTransfer.progress.privateSupportReference', { id: session.clientTransferId })}
                    </div>
                </div>
                {successfulRows.map((row) => (
                    <div className='account-progress' key={`${row.networkId}:${row.accountId}`}>
                        <div className='account-id'>{row.accountId}</div>
                        <div className='status'>{statusCopy(row, t)}</div>
                        {row.recovery === 'revoke_destination_key' && (
                            <>
                                <p>{t('newKeyTransfer.progress.revokeDescription')}</p>
                                <div className='key'>{row.destinationPublicKey}</div>
                                <FormButton
                                    color='red'
                                    disabled={isWorking}
                                    onClick={() =>
                                        void run(() =>
                                            revokeMeteorNewKeyDestination({
                                                clientTransferId: session.clientTransferId,
                                                accountId: row.accountId,
                                            })
                                        )
                                    }
                                >
                                    {t('newKeyTransfer.progress.revokeButton')}
                                </FormButton>
                            </>
                        )}
                        {row.lastError && <div className='error'>{row.lastError}</div>}
                    </div>
                ))}
                {(session.rejectedAccounts || []).map((row) => (
                    <div className='account-progress' key={`${row.networkId}:${row.accountId}`}>
                        <div className='account-id'>{row.accountId}</div>
                        <div className='error'>{t('newKeyTransfer.progress.rejected', { issue: row.issue })}</div>
                    </div>
                ))}
                {errorMessage && <p className='error'>{errorMessage}</p>}
                <div className='actions'>
                    {!isComplete && (
                        <>
                            <FormButton
                                disabled={isWorking}
                                onClick={() =>
                                    void run(() =>
                                        resumeMeteorNewKeyAccountTransfer(
                                            session.clientTransferId
                                        )
                                    )
                                }
                            >
                                {isWorking ? t('newKeyTransfer.progress.working') : t('newKeyTransfer.progress.resume')}
                            </FormButton>
                            <FormButton
                                color='gray'
                                disabled={isWorking}
                                onClick={() =>
                                    void run(() =>
                                        reconcileMeteorNewKeyAccountTransfer(
                                            session.clientTransferId
                                        )
                                    )
                                }
                            >
                                {t('newKeyTransfer.progress.checkCleanup')}
                            </FormButton>
                        </>
                    )}
                    <FormButton color='gray' onClick={() => history.replace('/')}>
                        {t('newKeyTransfer.progress.return')}
                    </FormButton>
                </div>
                {sessions.length > 1 && (
                    <label>
                        {t('newKeyTransfer.progress.viewAnother')}
                        <select
                            value={clientTransferId}
                            onChange={(event) => setClientTransferId(event.target.value)}
                        >
                            {sessions.map((candidate) => (
                                <option
                                    key={candidate.clientTransferId}
                                    value={candidate.clientTransferId}
                                >
                                    {candidate.clientTransferId}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>
        </ProgressPage>
    );
}
