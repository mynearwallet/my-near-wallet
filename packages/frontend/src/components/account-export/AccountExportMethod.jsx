import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { hasPendingMeteorNewKeyStart } from '../../services/meteorConnect';
import Container from '../common/styled/Container.css';
import MeteorConnectIcon from '../svg/MeteorConnectIcon';
import exportManualIcon from '../svg/Vector.svg';
import { trackMigrationMethodSelected } from './accountExportAnalytics';

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

    .method-tag {
        background: #fff;
        border-radius: 999px;
        color: #5380f5;
        font-size: 12px;
        font-weight: 600;
        line-height: 18px;
        margin-top: 16px;
        padding: 4px 12px;
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

export default function AccountExportMethod() {
    const { t } = useTranslation();
    const history = useHistory();
    const location = useLocation();
    const accountIds = location.state?.accountIds;

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
    const hasInterruptedStart = hasPendingMeteorNewKeyStart();

    const handleNewKeyTransfer = () => {
        trackMigrationMethodSelected('new_key', accountIds);
        history.push('/export-accounts/new-key-start', { accountIds });
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
                        onClick={handleNewKeyTransfer}
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
                        <span className='method-tag'>
                            {t('newKeyTransfer.recommended')}
                        </span>
                    </MethodButton>
                    <MethodButton
                        className='manual-export'
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
