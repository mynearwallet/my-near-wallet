import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import {
    // archiveMeteorNewKeyTransfer,
    isMeteorNewKeySourceKeyAbsent,
} from '../../services/meteorConnect';
// import { describeNewKeyTransferError } from '../../services/newKeyTransferState';
import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';
import AccountExportNotice from './AccountExportNotice';
import AccountExportSelectedAccountList from './AccountExportSelectedAccountList';
import {
    trackMigrationCleanupSelected,
    trackNewKeyMigrationCompleted,
} from './accountExportAnalytics';
import NewKeyTransferProgress from './NewKeyTransferProgress';
import useNewKeyTransfer from './useNewKeyTransfer';

const ActivatedPage = styled(Container)`
    max-width: 500px;

    &&& {
        h1,
        h2 {
            text-align: center !important;
        }
    }
`;

const UnconfirmedSection = styled.section`
    background: #fff6f6;
    border-radius: 8px;
    margin-top: 20px;
    padding: 15px;

    .section-title {
        color: #72727a;
        font-size: 14px;
        line-height: 20px;
        margin: 0 0 10px;
    }

    .account-id {
        background: #ffe9e9;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        line-height: 20px;
        overflow-wrap: anywhere;
        padding: 15px;
        word-break: break-word;
    }

    .account-id + .account-id {
        margin-top: 8px;
    }
`;

const FactNote = styled.p`
    color: #72727a;
    font-size: 13px;
    line-height: 19px;
    margin: 12px 0 0;
    text-align: center;
`;

// const ErrorMessage = styled.p`
//     color: #dc1f25;
//     margin: 20px 0 0;
//     text-align: center;
// `;

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
 * The transfer's completion screen — with TWO honest states (stabilization SD6/MNW-1):
 *
 * - IN PROGRESS: some accounts are secured, some are not. The keys are active, but Meteor has not
 *   finished securing every account — removal stays locked, and the way forward is Check status
 *   on the activation screen.
 * - COMPLETE: every accepted account is SECURED — proven on-chain, recovery phrase confirmed in
 *   full, imported into Meteor. Only now is source-key removal offered.
 *
 * Removing the account from this wallet remains a separate, opt-in step — the source key still
 * works, and it is the user's only way back if anything went wrong on Meteor's side. When the
 * source key is OBSERVED absent on-chain (Meteor's own cleanup removed it), the row is excluded
 * from removal rather than offered a DeleteKey that can only fail.
 */
export default function AccountExportNewKeyActivated() {
    const { t } = useTranslation();
    const history = useHistory();
    const { summary, isLoading, errorMessage } = useNewKeyTransfer({
        fallback: 'secured',
    });
    const didTrackCompletion = useRef(false);
    /** accountId → true once the exact source key is proven absent at finality. */
    const [absentSourceKeys, setAbsentSourceKeys] = useState({});
    // const [archiveError, setArchiveError] = useState('');
    // const [isArchiving, setIsArchiving] = useState(false);

    const isComplete = summary?.isFullySecured === true;

    useEffect(() => {
        if (summary == null || didTrackCompletion.current || !isComplete) {
            return;
        }
        // The completion analytics event fires only when every account is SECURED — firing it on
        // reaching this screen counted transfers as done while Meteor still owed work.
        didTrackCompletion.current = true;
        trackNewKeyMigrationCompleted({
            confirmed: summary.accepted.filter((account) => account.isSecured),
            unconfirmed: summary.accepted.filter((account) => !account.isSecured),
        });
    }, [summary, isComplete]);

    useEffect(() => {
        if (summary == null) {
            return;
        }
        let isActive = true;
        // Observation, never assumption (stabilization §6.2): a row only counts as cleaned when
        // the chain itself says the exact source key is gone.
        void (async () => {
            for (const account of summary.accepted) {
                if (!account.isSecured || account.sourcePublicKey == null) {
                    continue;
                }
                try {
                    const absent = await isMeteorNewKeySourceKeyAbsent({
                        accountId: account.accountId,
                        sourcePublicKey: account.sourcePublicKey,
                    });
                    if (absent && isActive) {
                        setAbsentSourceKeys((current) => ({
                            ...current,
                            [account.accountId]: true,
                        }));
                    }
                } catch {
                    // Unknown stays unknown; the row simply keeps its removal offer.
                }
            }
        })();
        return () => {
            isActive = false;
        };
    }, [summary]);

    if (isLoading || summary == null) {
        return (
            <ActivatedPage className='small-centered'>
                <div className='send-theme'>
                    <NewKeyTransferProgress activeStep={4} />
                    {/* No premature "transfer complete" heading while the transfer itself could
                        not even be loaded (MNW-4). */}
                    <h1>{t('newKeyTransfer.activated.loadingTitle')}</h1>
                    <h2>{errorMessage || t('newKeyTransfer.loading')}</h2>
                </div>
            </ActivatedPage>
        );
    }

    const secured = summary.accepted.filter((account) => account.isSecured);
    const unsecured = summary.accepted.filter((account) => !account.isSecured);
    const removable = secured.filter((account) => !absentSourceKeys[account.accountId]);
    const cleanedCount = secured.length - removable.length;

    return (
        <ActivatedPage className='small-centered'>
            <div className='send-theme'>
                <NewKeyTransferProgress activeStep={4} />
                <h1>
                    {t(
                        isComplete
                            ? 'newKeyTransfer.activated.title'
                            : 'newKeyTransfer.activated.inProgressTitle'
                    )}
                </h1>
                <h2>
                    {t(
                        isComplete
                            ? 'newKeyTransfer.activated.subtitle'
                            : 'newKeyTransfer.activated.inProgressSubtitle'
                    )}
                </h2>

                {isComplete && (
                    <AccountExportNotice variant='error'>
                        <p>{t('newKeyTransfer.activated.removalWarning')}</p>
                        <p>{t('newKeyTransfer.activated.removalRisk')}</p>
                    </AccountExportNotice>
                )}

                {secured.length > 0 && (
                    <AccountExportSelectedAccountList
                        accountIds={secured.map((account) => account.accountId)}
                        title={t('newKeyTransfer.activated.listTitle')}
                    />
                )}

                {cleanedCount > 0 && (
                    <FactNote>
                        {t('newKeyTransfer.activated.sourceKeyRemoved', {
                            count: cleanedCount,
                        })}
                    </FactNote>
                )}

                {unsecured.length > 0 && (
                    <UnconfirmedSection>
                        <p className='section-title'>
                            {t('newKeyTransfer.activated.unconfirmedTitle')}
                        </p>
                        {unsecured.map((account) => (
                            <div className='account-id' key={account.accountId}>
                                {account.accountId}
                            </div>
                        ))}
                    </UnconfirmedSection>
                )}

                {/* {(errorMessage || archiveError) && (
                    <ErrorMessage>{errorMessage || archiveError}</ErrorMessage>
                )} */}

                <Buttons>
                    {isComplete ? (
                        <>
                            {/* <FormButton
                                color='blue'
                                disabled={removable.length === 0}
                                onClick={() => {
                                    trackMigrationCleanupSelected({
                                        action: 'remove',
                                        accounts: removable,
                                    });
                                    history.push('/export-accounts/remove', {
                                        accountIds: removable.map(
                                            (account) => account.accountId
                                        ),
                                    });
                                }}
                            >
                                {t('newKeyTransfer.activated.remove')}
                            </FormButton> */}
                            <FormButton
                                color='blue'
                                disabled={removable.length === 0}
                                onClick={() => {
                                    trackMigrationCleanupSelected({
                                        action: 'keep',
                                        accounts: secured,
                                    });
                                    history.replace('/');
                                }}
                            >
                                {t('newKeyTransfer.activated.done')}
                            </FormButton>
                        </>
                    ) : (
                        <FormButton
                            color='blue'
                            onClick={() =>
                                history.replace('/export-accounts/new-key-activation', {
                                    clientTransferId: summary.clientTransferId,
                                })
                            }
                        >
                            {t('newKeyTransfer.activated.checkStatus')}
                        </FormButton>
                    )}
                    {/* {isComplete && (
                        <div className='secondary'>
                            <FormButton
                                className='link'
                                color='gray'
                                disabled={isArchiving}
                                onClick={async () => {
                                    setIsArchiving(true);
                                    setArchiveError('');
                                    try {
                                        await archiveMeteorNewKeyTransfer(
                                            summary.clientTransferId
                                        );
                                    } catch (error) {
                                        const { i18nKey, fallback } =
                                            describeNewKeyTransferError(error);
                                        setArchiveError(
                                            i18nKey
                                                ? t(i18nKey)
                                                : fallback ||
                                                      t('newKeyTransfer.genericError')
                                        );
                                        setIsArchiving(false);
                                        return;
                                    }
                                    history.replace('/');
                                }}
                            >
                                {t('newKeyTransfer.activated.archive')}
                            </FormButton>
                        </div>
                    )} */}
                    {/* <div className='secondary'>
                        <FormButton
                            className='link'
                            color='gray'
                            onClick={() => {
                                trackMigrationCleanupSelected({
                                    action: 'keep',
                                    accounts: secured,
                                });
                                history.replace('/');
                            }}
                        >
                            {t('newKeyTransfer.activated.keep')}
                        </FormButton>
                    </div> */}
                </Buttons>
            </div>
        </ActivatedPage>
    );
}
