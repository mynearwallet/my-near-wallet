import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { clearMeteorNewKeyAccountTransfer } from '../../services/meteorConnect';
import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';
import ExportAccountUnavailableIcon from '../svg/ExportAccountUnavailableIcon';
import AccountExportSelectedAccountList from './AccountExportSelectedAccountList';
import {
    describeNewKeyTransferError,
    NEW_KEY_TRANSFER_RECOVERY_ROUTE,
    newKeyTransferIssueKey,
} from '../../services/newKeyTransferState';
import { trackMigrationActivationRequested } from './accountExportAnalytics';
import useNewKeyTransfer from './useNewKeyTransfer';

const NewKeyReadyPage = styled(Container)`
    max-width: 500px;

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

const RefusedSection = styled.section`
    background: #fff6f6;
    border-radius: 8px;
    margin-top: 20px;
    padding: 15px;
`;

const RefusedSectionTitle = styled.p`
    color: #72727a;
    font-size: 14px;
    line-height: 20px;
    margin: 0 0 10px;
`;

const RefusedRow = styled.div`
    align-items: flex-start;
    background: #ffe9e9;
    border-radius: 8px;
    display: flex;
    gap: 12px;
    padding: 15px;

    & + & {
        margin-top: 8px;
    }

    .refused-icon {
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

    .issue {
        color: #dc1f25;
        font-size: 12px;
        line-height: 18px;
        margin-top: 4px;
    }
`;

const ErrorMessage = styled.div`
    color: #dc1f25;
    margin: 20px 0 0;
    text-align: center;
`;

/** The raw SDK id. Support searches for it; a user never has to read it. */
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

/**
 * Step 1 done: Meteor has minted a destination key for each account it accepted, and nothing is
 * on-chain yet. This screen is the last point at which walking away costs nothing.
 */
export default function AccountExportNewKeyReady() {
    const { t } = useTranslation();
    const history = useHistory();
    const { summary, isLoading, errorMessage, setErrorMessage } = useNewKeyTransfer({
        redirectWhenVerified: true,
    });
    const [isLeaving, setIsLeaving] = useState(false);
    const [clearFailure, setClearFailure] = useState(null);

    /**
     * Drop a transfer Meteor accepted nothing for on the way out. Nothing was minted and nothing
     * reached a chain, so there is no recovery state to preserve — and leaving the record behind
     * would make the next attempt discard it silently instead of starting clean.
     */
    const startOver = async () => {
        setIsLeaving(true);
        setClearFailure(null);
        try {
            await clearMeteorNewKeyAccountTransfer(summary.clientTransferId);
        } catch (error) {
            // Not clearable means it holds REAL recovery state — a signed AddKey, or a journal that
            // could not be read. Swallowing that and navigating away sent the user back to account
            // selection to hit the same fence again with no idea why
            // (REVIEW-consumer-implementation §6.3). Say what happened, and offer the one route
            // that can actually resolve it.
            const { i18nKey, fallback, code, isFenced } =
                describeNewKeyTransferError(error);
            setErrorMessage(
                i18nKey ? t(i18nKey) : fallback || t('newKeyTransfer.genericError')
            );
            setClearFailure({ code, isFenced });
            setIsLeaving(false);
            return;
        }
        history.replace('/export-accounts/select');
    };

    if (isLoading || summary == null) {
        return (
            <NewKeyReadyPage className='small-centered'>
                <div className='send-theme'>
                    <h1>{t('newKeyTransfer.ready.title')}</h1>
                    <h2>{errorMessage || t('newKeyTransfer.loading')}</h2>
                </div>
            </NewKeyReadyPage>
        );
    }

    const { accepted, refused, acceptedNothing } = summary;

    return (
        <NewKeyReadyPage className='small-centered'>
            <div className='send-theme'>
                <h1>
                    {t(
                        acceptedNothing
                            ? 'newKeyTransfer.ready.noneTitle'
                            : 'newKeyTransfer.ready.title'
                    )}
                </h1>
                <h2>
                    {t(
                        acceptedNothing
                            ? 'newKeyTransfer.ready.noneSubtitle'
                            : 'newKeyTransfer.ready.subtitle'
                    )}
                </h2>

                {accepted.length > 0 && (
                    <AccountExportSelectedAccountList
                        accountIds={accepted.map((account) => account.accountId)}
                        title={t('newKeyTransfer.ready.acceptedTitle')}
                    />
                )}

                {refused.length > 0 && (
                    <RefusedSection>
                        <RefusedSectionTitle>
                            {t('newKeyTransfer.ready.refusedTitle')}
                        </RefusedSectionTitle>
                        {refused.map((account) => (
                            <RefusedRow key={account.accountId}>
                                <ExportAccountUnavailableIcon className='refused-icon' />
                                <div>
                                    <div className='account-id'>{account.accountId}</div>
                                    <div className='issue'>
                                        {t(newKeyTransferIssueKey(account.issue))}
                                    </div>
                                </div>
                            </RefusedRow>
                        ))}
                    </RefusedSection>
                )}

                {!acceptedNothing && (
                    <Explainer>{t('newKeyTransfer.ready.explainer')}</Explainer>
                )}
                {errorMessage && (
                    <ErrorMessage>
                        {errorMessage}
                        {clearFailure?.code && (
                            <SupportCode>
                                {t('newKeyTransfer.supportCode', {
                                    code: clearFailure.code,
                                })}
                            </SupportCode>
                        )}
                        {clearFailure?.isFenced && (
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
                    {acceptedNothing ? (
                        <FormButton disabled={isLeaving} onClick={() => void startOver()}>
                            {t('newKeyTransfer.ready.startOver')}
                        </FormButton>
                    ) : (
                        <>
                            <FormButton
                                onClick={() => {
                                    trackMigrationActivationRequested(accepted);
                                    history.push('/export-accounts/new-key-activation', {
                                        clientTransferId: summary.clientTransferId,
                                    });
                                }}
                            >
                                {t('newKeyTransfer.ready.activate')}
                            </FormButton>
                            <div className='secondary'>
                                <FormButton
                                    className='link'
                                    color='gray'
                                    onClick={() => history.replace('/')}
                                >
                                    {t('newKeyTransfer.ready.finishLater')}
                                </FormButton>
                            </div>
                            {/* Once an AddKey intent is journaled the destination key may be
                                live on-chain — cancelling is no longer an honest offer (MNW-7);
                                the SDK would refuse it anyway. */}
                            {!summary.hasAddKeyIntent && (
                                <div className='secondary'>
                                    <FormButton
                                        className='link'
                                        color='red'
                                        disabled={isLeaving}
                                        onClick={() => void startOver()}
                                    >
                                        {t('newKeyTransfer.ready.cancelTransfer')}
                                    </FormButton>
                                </div>
                            )}
                        </>
                    )}
                </Buttons>
            </div>
        </NewKeyReadyPage>
    );
}
