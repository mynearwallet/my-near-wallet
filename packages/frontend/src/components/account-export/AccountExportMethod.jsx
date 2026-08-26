import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import {
    hasPendingMeteorNewKeyStart,
    meteorNetworkId,
    // promptMeteorAccountTransfer,
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
import MeteorConnectIcon from '../svg/MeteorConnectIcon';
import exportManualIcon from '../svg/Vector.svg';
import {
    trackMigrationMethodSelected,
    trackNewKeyPrepareFailed,
    trackNewKeyPrepareStarted,
    trackNewKeyPrepareSucceeded,
} from './accountExportAnalytics';
import {
    // loadExportAccountSecrets,
    loadNewKeyTransferAccounts,
} from './accountExportAccounts';
// import { saveAccountExportSuccess } from './accountExportSuccessState';

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

const DiscardPendingRow = styled.div`
    margin-top: 8px;
    text-align: center;
`;

// const Advanced = styled.div`
//     margin-top: 40px;
//     text-align: center;

//     .advanced-description {
//         color: #72727a;
//         font-size: 13px;
//         line-height: 20px;
//         margin: 16px auto 0;
//         max-width: 520px;
//     }

//     .advanced-action {
//         margin-top: 12px;
//     }
// `;

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

export default function AccountExportMethod() {
    const { t } = useTranslation();
    const history = useHistory();
    const location = useLocation();
    const accountIds = location.state?.accountIds;
    const [isExporting, setIsExporting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    /** The raw SDK id behind `errorMessage`, shown as fine print so support can search for it. */
    const [errorCode, setErrorCode] = useState('');
    /**
     * Whether the failure is the global fence. Offering "try again" here is offering something the
     * SDK guarantees will fail — the only real route forward is reconciliation
     * (REVIEW-consumer-implementation B-04/M-03).
     */
    const [isFencedError, setIsFencedError] = useState(false);
    // const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            history.replace('/export-accounts/select');
        }
    }, [accountIds, history]);

    /**
     * Stabilization SD7: a start interrupted by bridge/session expiry left its durable id
     * stashed, and calling start again REPLAYS it — Meteor resumes exactly where the user was
     * (typically mid-way through confirming the recovery phrase) instead of minting a second set
     * of destination keys. The button below says "Continue" when that is what a click will do.
     */
    const [hasInterruptedStart, setHasInterruptedStart] = useState(() =>
        hasPendingMeteorNewKeyStart()
    );

    /**
     * Drop the interrupted attempt entirely — stash, wallet-side session, and any crash-window
     * start result — so the next click starts a genuinely fresh transfer. (Merely selecting
     * different accounts also starts fresh — the replay is fingerprint-matched — but the user
     * should never have to know that.)
     */
    const discardInterruptedStart = async () => {
        setIsExporting(true);
        setErrorMessage('');
        setErrorCode('');
        setIsFencedError(false);
        try {
            await startOverMeteorNewKeyTransfer();
        } catch (error) {
            const { i18nKey, fallback, code, isFenced } =
                describeNewKeyTransferError(error);
            setErrorMessage(
                i18nKey ? t(i18nKey) : fallback || t('newKeyTransfer.genericError')
            );
            setErrorCode(code);
            setIsFencedError(isFenced);
        }
        setHasInterruptedStart(hasPendingMeteorNewKeyStart());
        setIsExporting(false);
    };

    const handleNewKeyTransfer = async () => {
        trackMigrationMethodSelected('new_key', accountIds);
        trackNewKeyPrepareStarted(accountIds);
        setIsExporting(true);
        setErrorMessage('');
        setErrorCode('');
        setIsFencedError(false);
        try {
            const accounts = await loadNewKeyTransferAccounts(accountIds);
            // No target platform is pinned here: the SDK popup asks the user to choose the
            // destination wallet (Meteor Web / Meteor Mobile, plus the dev-gated local wallet),
            // and records what was actually chosen on the session for the verify turn.
            const session = await startMeteorNewKeyAccountTransfer({
                accounts,
                networkId: meteorNetworkId,
            });
            // Meteor has answered and its destination keys are journaled; which accounts it
            // accepted is read from the session on the next screen, not passed through history.
            const rows = session.startOutput?.accounts || [];
            trackNewKeyPrepareSucceeded({
                accounts,
                accepted: rows.filter(({ ok }) => ok),
                refused: rows.filter(({ ok }) => !ok),
            });
            history.push('/export-accounts/new-key-ready', {
                clientTransferId: session.clientTransferId,
            });
        } catch (error) {
            trackNewKeyPrepareFailed({
                stage: error?.availability != null ? 'eligibility' : 'meteor_start',
                error,
            });
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
                const { i18nKey, fallback, code, isFenced } =
                    describeNewKeyTransferError(error);
                setErrorMessage(
                    i18nKey ? t(i18nKey) : fallback || t('newKeyTransfer.genericError')
                );
                setErrorCode(code);
                setIsFencedError(isFenced);
            }
            // The failed attempt's durable id (if any) is stashed by the service; re-clicking
            // replays it, and the copy should say so.
            setHasInterruptedStart(hasPendingMeteorNewKeyStart());
            setIsExporting(false);
        }
    };

    // const handleExistingSecretTransfer = async () => {
    //     let didNavigateToSuccess = false;

    //     setIsExporting(true);
    //     setErrorMessage('');
    //     setErrorCode('');
    //     setIsFencedError(false);

    //     try {
    //         const accounts = await loadExportAccountSecrets(accountIds);
    //         const outcome = await promptMeteorAccountTransfer({
    //             accounts,
    //             networkId: meteorNetworkId,
    //         });

    //         if (outcome.status === 'imported') {
    //             didNavigateToSuccess = true;
    //             saveAccountExportSuccess(accountIds);
    //             history.push('/export-accounts/success', { accountIds });
    //         } else if (outcome.status === 'declined') {
    //             setErrorMessage(t('newKeyTransfer.existingSecret.declined'));
    //         } else if (outcome.status === 'expired') {
    //             setErrorMessage(t('newKeyTransfer.existingSecret.expired'));
    //         }
    //     } catch (error) {
    //         // Translated copy first, the SDK id as fine print — never the raw id as the sentence.
    //         const { i18nKey, code } = describeNewKeyTransferError(error);
    //         setErrorMessage(
    //             i18nKey ? t(i18nKey) : t('newKeyTransfer.existingSecret.startFailed')
    //         );
    //         setErrorCode(code);
    //     } finally {
    //         if (!didNavigateToSuccess) {
    //             setIsExporting(false);
    //         }
    //     }
    // };

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
                        <span className='method-title'>
                            {t(
                                hasInterruptedStart
                                    ? 'newKeyTransfer.continueTitle'
                                    : 'newKeyTransfer.title'
                            )}
                        </span>
                        <span className='method-description'>
                            {t(
                                hasInterruptedStart
                                    ? 'newKeyTransfer.continueDescription'
                                    : 'newKeyTransfer.description'
                            )}
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
                        onClick={() => {
                            trackMigrationMethodSelected('manual', accountIds);
                            history.push('/export-accounts/manual', { accountIds });
                        }}
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

                {hasInterruptedStart && (
                    <DiscardPendingRow>
                        <FormButton
                            className='link'
                            color='red'
                            disabled={isExporting}
                            onClick={() => void discardInterruptedStart()}
                        >
                            {t('newKeyTransfer.startOver.discardPending')}
                        </FormButton>
                    </DiscardPendingRow>
                )}

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

                {/* <Advanced>
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
                </Advanced> */}
            </div>
        </ExportMethodPage>
    );
}
