import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import {
    hasJournaledMeteorNewKeyVerification,
    runMeteorNewKeyAddKeys,
    verifyMeteorNewKeyAccountTransfer,
} from '../../services/meteorConnect';
import {
    describeNewKeyTransferError,
    newKeyTransferActivationIssueKey,
} from '../../services/newKeyTransferState';
import FormButton from '../common/FormButton';
import LoadingSpinner from '../common/loader/LoadingSpinner';
import Container from '../common/styled/Container.css';
import ExportAccountSelectedIcon from '../svg/ExportAccountSelectedIcon';
import ExportAccountUnavailableIcon from '../svg/ExportAccountUnavailableIcon';
import useNewKeyTransfer from './useNewKeyTransfer';

const ActivationPage = styled(Container)`
    max-width: 500px;

    &&& {
        h1,
        h2 {
            text-align: center !important;
        }
    }
`;

const AccountSection = styled.section`
    background: #fafafa;
    border-radius: 8px;
    margin-top: 10px;
    padding: 15px;
`;

const AccountSectionTitle = styled.p`
    color: #72727a;
    font-size: 14px;
    line-height: 20px;
    margin: 0 0 10px;
`;

const ActivationProgress = styled.div`
    margin-bottom: 24px;
    margin-top: 18px;
`;

const ActivationProgressTrack = styled.div`
    background: #e4e4e8;
    border-radius: 999px;
    height: 10px;
    overflow: hidden;
`;

const ActivationProgressFill = styled.div`
    background: #0072ce;
    border-radius: inherit;
    height: 100%;
    transition: width 200ms ease;
`;

const ActivationProgressLabel = styled.p`
    color: #000000;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    margin: 10px 0 0;
    text-align: center;
`;

const AccountRow = styled.div`
    background: #f0f0f1;
    border-radius: 8px;
    padding: 15px;

    & + & {
        margin-top: 8px;
    }

    .account-id {
        font-size: 16px;
        font-weight: 600;
        line-height: 20px;
        overflow-wrap: anywhere;
        word-break: break-word;
    }

    .issue {
        color: #dc1f25;
        font-size: 12px;
        line-height: 18px;
        margin-top: 6px;
    }
`;

const StatusLine = styled.div`
    align-items: center;
    color: #72727a;
    display: flex;
    font-size: 12px;
    gap: 5px;
    line-height: 20px;
    margin-top: 6px;

    &.failed {
        color: #dc1f25;
    }

    &.pending {
        color: #0072ce;
    }

    &.confirmed {
        color: #5ace84;
    }
`;

const StatusIconSlot = styled.span`
    align-items: center;
    display: inline-flex;
    flex: 0 0 20px;
    height: 20px;
    justify-content: center;
    width: 20px;

    svg {
        height: 20px;
        width: 20px;
    }
`;

const KeepOpenNote = styled.p`
    color: #72727a;
    font-size: 14px;
    line-height: 20px;
    margin: 20px 0 0;
    text-align: center;
`;

const ErrorMessage = styled.p`
    color: #dc1f25;
    margin: 20px 0 0;
    text-align: center;
`;

const Buttons = styled.div`
    margin-top: 40px;
    text-align: center;

    > button {
        width: 100%;
    }

    .secondary {
        margin-top: 8px;
    }
`;

/** How full the bar is for one account. `failed` contributes nothing — it is not progress. */
const STATUS_WEIGHT = {
    waiting: 0,
    adding: 0.25,
    added: 0.6,
    verifying: 0.8,
    confirmed: 1,
    failed: 0,
};

const statusIcon = (status) => {
    if (status === 'confirmed') {
        return <ExportAccountSelectedIcon />;
    }
    if (status === 'failed') {
        return <ExportAccountUnavailableIcon />;
    }
    if (status === 'waiting') {
        return null;
    }
    return <LoadingSpinner size={20} />;
};

const statusClassName = (status) => {
    if (status === 'failed') {
        return 'failed';
    }
    if (status === 'confirmed') {
        return 'confirmed';
    }
    return 'pending';
};

const setEvery = (accountIds, status) =>
    Object.fromEntries(accountIds.map((accountId) => [accountId, status]));

/**
 * Step 2 and 3: this wallet signs and broadcasts an AddKey for every accepted account, then Meteor
 * proves each key is live on-chain and imports the account.
 *
 * Both steps run under the SDK's crash-safe AddKey journal, so this screen never decides what is
 * safe to redo — it asks. `hasJournaledMeteorNewKeyVerification` is what makes a reload here
 * harmless: the verification proof is written as the last AddKey finalizes, so its presence means
 * the on-chain half is done and only Meteor's confirmation is left. Running AddKeys a second time
 * on a finished transfer would meet a start result the SDK deliberately discarded and fail.
 */
export default function AccountExportNewKeyActivation() {
    const { t } = useTranslation();
    const history = useHistory();
    const { summary, isLoading, errorMessage, reload } = useNewKeyTransfer({
        redirectWhenVerified: true,
    });
    const [statuses, setStatuses] = useState({});
    const [issues, setIssues] = useState({});
    const [isRunning, setIsRunning] = useState(false);
    const [failureMessage, setFailureMessage] = useState('');
    const hasAutoStarted = useRef(false);

    const describeFailure = useCallback(
        (error) => {
            const { i18nKey, fallback } = describeNewKeyTransferError(error);
            return i18nKey ? t(i18nKey) : fallback || t('newKeyTransfer.genericError');
        },
        [t]
    );

    const runActivation = useCallback(
        async (transferSessionId, accountIds) => {
            setIsRunning(true);
            setFailureMessage('');
            setIssues({});
            try {
                if (!(await hasJournaledMeteorNewKeyVerification(transferSessionId))) {
                    setStatuses(setEvery(accountIds, 'waiting'));
                    await runMeteorNewKeyAddKeys({
                        transferSessionId,
                        // Submissions are strictly sequential, so the account this fires for
                        // starting means every earlier one has already finalized.
                        onProgress: ({ accountId }) =>
                            setStatuses((current) => {
                                const next = { ...current };
                                for (const id of accountIds) {
                                    if (next[id] === 'adding') {
                                        next[id] = 'added';
                                    }
                                }
                                next[accountId] = 'adding';
                                return next;
                            }),
                    });
                    setStatuses(setEvery(accountIds, 'added'));
                }
                setStatuses(setEvery(accountIds, 'verifying'));

                const { output } = await verifyMeteorNewKeyAccountTransfer({
                    transferSessionId,
                });
                const nextStatuses = {};
                const nextIssues = {};
                for (const account of output.accounts) {
                    const verified = account.activation === 'verified';
                    nextStatuses[account.accountId] = verified ? 'confirmed' : 'failed';
                    if (!verified) {
                        nextIssues[account.accountId] = account.issue;
                    }
                }
                setStatuses((current) => ({ ...current, ...nextStatuses }));
                setIssues(nextIssues);

                if (accountIds.every((id) => nextStatuses[id] === 'confirmed')) {
                    history.replace('/export-accounts/new-key-activated', {
                        clientTransferId: summary?.clientTransferId,
                    });
                    return;
                }
            } catch (error) {
                setFailureMessage(describeFailure(error));
                // Nothing here is rolled back — an AddKey that landed stays landed. So keep the
                // rows that got somewhere real, and fail only the ones still mid-flight; calling
                // an account "Failed" when its key is live on-chain would be a lie the user acts
                // on. Retrying reconciles whatever is already journaled.
                setStatuses((current) =>
                    Object.fromEntries(
                        accountIds.map((accountId) => [
                            accountId,
                            current[accountId] === 'confirmed' || current[accountId] === 'added'
                                ? current[accountId]
                                : 'failed',
                        ])
                    )
                );
            } finally {
                setIsRunning(false);
                await reload();
            }
        },
        [describeFailure, history, reload, summary]
    );

    const acceptedIds = summary?.accepted.map((account) => account.accountId);
    const transferSessionId = summary?.transferSessionId;

    useEffect(() => {
        if (
            hasAutoStarted.current ||
            transferSessionId == null ||
            acceptedIds == null ||
            acceptedIds.length === 0
        ) {
            return;
        }
        hasAutoStarted.current = true;
        void runActivation(transferSessionId, acceptedIds);
        // `acceptedIds` is rebuilt on every render; the ref is what makes this run once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transferSessionId]);

    if (isLoading || summary == null) {
        return (
            <ActivationPage className='small-centered'>
                <div className='send-theme'>
                    <h1>{t('newKeyTransfer.activation.title')}</h1>
                    <h2>{errorMessage || t('newKeyTransfer.loading')}</h2>
                </div>
            </ActivationPage>
        );
    }

    const accounts = summary.accepted;
    const confirmedCount = accounts.filter(
        (account) => statuses[account.accountId] === 'confirmed'
    ).length;
    const completionPercentage =
        accounts.length === 0
            ? 0
            : (accounts.reduce(
                  (total, account) =>
                      total + (STATUS_WEIGHT[statuses[account.accountId]] || 0),
                  0
              ) /
                  accounts.length) *
              100;

    return (
        <ActivationPage className='small-centered'>
            <div className='send-theme'>
                <h1>{t('newKeyTransfer.activation.title')}</h1>
                <h2>{t('newKeyTransfer.activation.subtitle')}</h2>

                <ActivationProgress>
                    <ActivationProgressTrack>
                        <ActivationProgressFill
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </ActivationProgressTrack>
                    <ActivationProgressLabel>
                        {t('newKeyTransfer.activation.progress', {
                            completed: confirmedCount,
                            total: accounts.length,
                        })}
                    </ActivationProgressLabel>
                </ActivationProgress>

                <AccountSection>
                    <AccountSectionTitle>
                        {t('newKeyTransfer.activation.statusTitle')}
                    </AccountSectionTitle>
                    {accounts.map((account) => {
                        const status = statuses[account.accountId] || 'waiting';
                        return (
                            <AccountRow key={account.accountId}>
                                <div className='account-id'>{account.accountId}</div>
                                <StatusLine className={statusClassName(status)}>
                                    <StatusIconSlot>{statusIcon(status)}</StatusIconSlot>
                                    <span>
                                        {t(`newKeyTransfer.activationStatus.${status}`)}
                                    </span>
                                </StatusLine>
                                {issues[account.accountId] && (
                                    <div className='issue'>
                                        {t(
                                            newKeyTransferActivationIssueKey(
                                                issues[account.accountId]
                                            )
                                        )}
                                    </div>
                                )}
                            </AccountRow>
                        );
                    })}
                </AccountSection>

                {isRunning && (
                    <KeepOpenNote>
                        {t('newKeyTransfer.activation.keepOpen')}
                    </KeepOpenNote>
                )}
                {failureMessage && <ErrorMessage>{failureMessage}</ErrorMessage>}

                {!isRunning && (
                    <Buttons>
                        <FormButton
                            onClick={() =>
                                void runActivation(
                                    summary.transferSessionId,
                                    accounts.map((account) => account.accountId)
                                )
                            }
                        >
                            {t('newKeyTransfer.activation.retry')}
                        </FormButton>
                        <div className='secondary'>
                            <FormButton
                                className='link'
                                color='gray'
                                onClick={() => history.replace('/')}
                            >
                                {t('newKeyTransfer.activation.cancel')}
                            </FormButton>
                        </div>
                    </Buttons>
                )}
            </div>
        </ActivationPage>
    );
}
