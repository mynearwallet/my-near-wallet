import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { startOverMeteorNewKeyTransfer } from '../../services/meteorConnect';
import {
    describeNewKeyTransferError,
    NEW_KEY_TRANSFER_RECOVERY_ROUTE,
} from '../../services/newKeyTransferState';
import FormButton from '../common/FormButton';
import {
    trackMigrationStartOverCancelled,
    trackMigrationStartOverFailed,
    trackMigrationStartOverPrompted,
    trackMigrationStartOverRequested,
    trackMigrationStartOverSucceeded,
} from './accountExportAnalytics';

const WarningPanel = styled.div`
    background: #fff6f6;
    border-radius: 8px;
    margin-top: 16px;
    padding: 15px;
    text-align: left;

    .warning-title {
        color: #dc1f25;
        font-size: 14px;
        font-weight: 600;
        line-height: 20px;
        margin: 0 0 8px;
    }

    .warning-body {
        color: #72727a;
        font-size: 13px;
        line-height: 19px;
        margin: 0;
    }
`;

const ProgressNote = styled.div`
    color: #72727a;
    font-size: 13px;
    line-height: 19px;
    margin-top: 12px;
    text-align: center;
`;

const ErrorMessage = styled.div`
    color: #dc1f25;
    margin: 12px 0 0;
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

/**
 * The honest "cancel this transfer and start over" for a transfer whose AddKey intent is already
 * journaled (stabilization follow-up to MNW-7): the destination keys may be live on-chain, so a
 * plain discard is never offered — instead each key is removed with the account's own SOURCE key,
 * the SDK re-proves the removals at finality, and only then is the record cleared. The user is
 * free to start a fresh transfer to ANY destination wallet afterwards.
 *
 * Renders nothing once Meteor has SECURED an account: those keys are what the imported accounts
 * run on, and the honest exits (Check status → archive; or remove the accounts in Meteor) are
 * already on the screens that show secured rows.
 */
export default function NewKeyTransferStartOverControl({ summary, disabled }) {
    const { t } = useTranslation();
    const history = useHistory();
    const [isConfirming, setIsConfirming] = useState(false);
    const [progress, setProgress] = useState(null);
    const [isWorking, setIsWorking] = useState(false);
    const [failure, setFailure] = useState(null);
    const attempt = useRef(0);

    if (summary == null || summary.securedCount > 0) {
        return null;
    }

    const startOver = async () => {
        const attemptNumber = ++attempt.current;
        const startedAt = Date.now();
        trackMigrationStartOverRequested({ summary, attemptNumber });
        setIsWorking(true);
        setFailure(null);
        setProgress(null);
        try {
            await startOverMeteorNewKeyTransfer({
                clientTransferId: summary.clientTransferId,
                onProgress: ({ index, total }) => setProgress({ index, total }),
            });
        } catch (error) {
            trackMigrationStartOverFailed({
                summary,
                error,
                attemptNumber,
                durationMs: Date.now() - startedAt,
            });
            const { i18nKey, fallback, code, isFenced } =
                describeNewKeyTransferError(error);
            setFailure({
                message: i18nKey
                    ? t(i18nKey)
                    : fallback || t('newKeyTransfer.genericError'),
                code,
                isFenced,
            });
            setIsWorking(false);
            setProgress(null);
            return;
        }
        trackMigrationStartOverSucceeded({
            summary,
            attemptNumber,
            durationMs: Date.now() - startedAt,
        });
        history.replace('/export-accounts/select');
    };

    return (
        <div className='secondary'>
            {!isConfirming ? (
                <FormButton
                    className='link'
                    color='red'
                    disabled={disabled || isWorking}
                    onClick={() => {
                        trackMigrationStartOverPrompted(summary);
                        setIsConfirming(true);
                    }}
                >
                    {t('newKeyTransfer.startOver.link')}
                </FormButton>
            ) : (
                <>
                    <WarningPanel>
                        <p className='warning-title'>
                            {t('newKeyTransfer.startOver.warningTitle')}
                        </p>
                        <p className='warning-body'>
                            {t('newKeyTransfer.startOver.warningBody')}
                        </p>
                    </WarningPanel>
                    {isWorking ? (
                        <ProgressNote>
                            {progress != null
                                ? t('newKeyTransfer.startOver.removing', {
                                      completed: progress.index,
                                      total: progress.total,
                                  })
                                : t('newKeyTransfer.loading')}
                        </ProgressNote>
                    ) : (
                        <>
                            <FormButton
                                color='red'
                                disabled={disabled}
                                onClick={() => void startOver()}
                            >
                                {t('newKeyTransfer.startOver.confirm')}
                            </FormButton>
                            <div className='secondary'>
                                <FormButton
                                    className='link'
                                    color='gray'
                                    onClick={() => {
                                        trackMigrationStartOverCancelled(summary);
                                        setIsConfirming(false);
                                        setFailure(null);
                                    }}
                                >
                                    {t('newKeyTransfer.startOver.keep')}
                                </FormButton>
                            </div>
                        </>
                    )}
                    {failure && (
                        <ErrorMessage>
                            {failure.message}
                            {failure.code && (
                                <SupportCode>
                                    {t('newKeyTransfer.supportCode', {
                                        code: failure.code,
                                    })}
                                </SupportCode>
                            )}
                            {failure.isFenced && (
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
                </>
            )}
        </div>
    );
}
