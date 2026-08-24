import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import CONFIG from '../../config';
import {
    meteorNetworkId,
    // promptMeteorAccountTransfer,
    startMeteorNewKeyAccountTransfer,
} from '../../services/meteorConnect';
import {
    describeNewKeyTransferError,
    NEW_KEY_TRANSFER_RECOVERY_ROUTE,
    newKeyTransferEligibilityKey,
} from '../../services/newKeyTransferState';
import Checkbox from '../common/Checkbox';
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

const DestinationChoice = styled.div`
    margin-top: 32px;

    .destination-heading {
        color: #24272a;
        font-size: 14px;
        font-weight: 600;
        line-height: 20px;
        text-align: center;
    }

    .destination-options {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 12px;
    }
`;

const DestinationButton = styled.button`
    background-color: #ffffff;
    border: 1px solid ${(props) => (props.isSelected ? '#0072ce' : '#e5e5e6')};
    border-radius: 8px;
    box-shadow: ${(props) => (props.isSelected ? '0 0 0 1px #0072ce' : 'none')};
    color: #24272a;
    cursor: pointer;
    font-size: 14px;
    line-height: 20px;
    min-width: 180px;
    padding: 12px 16px;
    text-align: left;

    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }

    .destination-title {
        display: block;
        font-weight: 600;
    }

    .destination-description {
        color: #72727a;
        display: block;
        font-size: 13px;
        margin-top: 2px;
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
    /**
     * Which Meteor Wallet receives the accounts. Both are real destinations now that the V2
     * mobile app implements the new-key transfer wallet side; the SDK turns this into the app id
     * the bridge link opens ("mobile" → the configured mobile wallet, "web" → the matching web
     * wallet for this environment), so it must be chosen BEFORE `start()` — the link is minted
     * there and cannot be repointed afterwards.
     */
    const [destination, setDestination] = useState('web');
    /** A development build may retarget a WEB transfer at a locally served wallet. */
    const [useLocalDevWallet, setUseLocalDevWallet] = useState(false);
    /**
     * The dev local-wallet override only exists for the web destination — a locally served page
     * is not something the mobile app can be pointed at.
     */
    const targetPlatform =
        destination === 'mobile' ? 'mobile' : useLocalDevWallet ? 'web_local_dev' : 'web';
    // const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            history.replace('/export-accounts/select');
        }
    }, [accountIds, history]);

    const handleNewKeyTransfer = async () => {
        trackMigrationMethodSelected('new_key', accountIds);
        trackNewKeyPrepareStarted(accountIds);
        setIsExporting(true);
        setErrorMessage('');
        setErrorCode('');
        setIsFencedError(false);
        try {
            const accounts = await loadNewKeyTransferAccounts(accountIds);
            const session = await startMeteorNewKeyAccountTransfer({
                accounts,
                networkId: meteorNetworkId,
                targetPlatform,
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

                <DestinationChoice>
                    <div className='destination-heading'>
                        {t('newKeyTransfer.destination.heading')}
                    </div>
                    <div className='destination-options'>
                        <DestinationButton
                            disabled={isExporting}
                            aria-pressed={destination === 'web'}
                            isSelected={destination === 'web'}
                            onClick={() => setDestination('web')}
                            type='button'
                        >
                            <span className='destination-title'>
                                {t('newKeyTransfer.destination.webTitle')}
                            </span>
                            <span className='destination-description'>
                                {t('newKeyTransfer.destination.webDescription')}
                            </span>
                        </DestinationButton>
                        <DestinationButton
                            disabled={isExporting}
                            aria-pressed={destination === 'mobile'}
                            isSelected={destination === 'mobile'}
                            onClick={() => setDestination('mobile')}
                            type='button'
                        >
                            <span className='destination-title'>
                                {t('newKeyTransfer.destination.mobileTitle')}
                            </span>
                            <span className='destination-description'>
                                {t('newKeyTransfer.destination.mobileDescription')}
                            </span>
                        </DestinationButton>
                    </div>
                </DestinationChoice>

                {CONFIG.IS_DEVELOPMENT && destination === 'web' && (
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
