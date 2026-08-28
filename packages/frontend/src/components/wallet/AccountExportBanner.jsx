import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import {
    getMeteorNewKeyTransferSessions,
    hasJournaledMeteorNewKeyVerification,
} from '../../services/meteorConnect';
import {
    findResumableNewKeyTransfer,
    summarizeNewKeyTransferSession,
} from '../../services/newKeyTransferState';
import {
    trackMigrationEntryClicked,
    trackMigrationEntryLoadFailed,
} from '../account-export/accountExportAnalytics';

const AccountExportBannerContainer = styled.section`
    margin-bottom: 28px;
    margin-top: 16px;
`;

const AccountExportBannerContent = styled.div`
    align-items: center;
    background: linear-gradient(105deg, #ffd39a 0%, #ffe5bb 100%);
    border-radius: 16px;
    display: flex;
    justify-content: space-between;
    padding: 26px 42px;

    @media (max-width: 600px) {
        align-items: stretch;
        border-radius: 12px;
        flex-direction: column;
        padding: 14px 20px;
    }
`;

const BannerCopy = styled.div`
    color: #fff;
    max-width: 740px;
`;

const BannerTitle = styled.div`
    color: #000;
    font-size: 20px;
    font-weight: 700;
    line-height: 26px;
    margin: 0;
`;

const BannerDescription = styled.div`
    color: #000;
    font-size: 14px;
    font-weight: 400;
    line-height: 21px;
    margin: 6px 0 0;
`;

const BannerLink = styled(Link)`
    align-items: center;
    background: #fff;
    border: 2px solid #fff;
    border-radius: 50px;
    color: #0072ce;
    display: flex;
    font-size: 16px;
    font-weight: 700;
    height: 48px;
    justify-content: center;
    line-height: 24px;
    margin-left: 32px;
    min-width: 250px;
    text-align: center;

    &:hover {
        background: #f5f8ff;
        border-color: #f5f8ff;
        color: #0063b4;
    }

    @media (max-width: 600px) {
        margin: 20px 0 0;
        width: 100%;
    }
`;

/**
 * Where an unfinished transfer picks up. A resolved start moves directly into step 2, whether or
 * not an AddKey intent has been journaled yet; the activation screen asks the journal what work is
 * actually left and waits for the corresponding user action.
 */
const resumeRoute = (summary) =>
    summary == null
        ? '/export-accounts/select'
        : {
              pathname: '/export-accounts/new-key-activation',
              state: { clientTransferId: summary.clientTransferId, isResume: true },
          };

export default function AccountExportBanner() {
    const { t } = useTranslation();
    const [pendingSummary, setPendingSummary] = useState(null);
    const [resumeStage, setResumeStage] = useState(undefined);

    useEffect(() => {
        let isActive = true;
        void (async () => {
            try {
                const sessions = await getMeteorNewKeyTransferSessions();
                const resumable = findResumableNewKeyTransfer(sessions);
                const summary = summarizeNewKeyTransferSession(resumable);
                let nextResumeStage;
                if (summary?.isAwaitingWalletCompletion) {
                    nextResumeStage = 'wallet_completion';
                } else if (summary != null) {
                    try {
                        nextResumeStage = (await hasJournaledMeteorNewKeyVerification(
                            summary.transferSessionId
                        ))
                            ? 'verify_keys'
                            : 'activate_keys';
                    } catch (error) {
                        trackMigrationEntryLoadFailed(error);
                        nextResumeStage = 'activate_keys';
                    }
                }
                if (isActive) {
                    setPendingSummary(summary);
                    setResumeStage(nextResumeStage);
                }
            } catch (error) {
                trackMigrationEntryLoadFailed(error);
                // A journal this banner cannot read is not something to shout about here; the
                // export screens report it properly. Offer the ordinary entry point.
            }
        })();
        return () => {
            isActive = false;
        };
    }, []);

    return (
        <AccountExportBannerContainer>
            <AccountExportBannerContent>
                <BannerCopy>
                    <BannerTitle>{t('accountExport.banner.title')}</BannerTitle>
                    <BannerDescription>
                        {t('accountExport.banner.description')}
                    </BannerDescription>
                </BannerCopy>
                <BannerLink
                    to={resumeRoute(pendingSummary)}
                    onClick={() =>
                        trackMigrationEntryClicked({
                            entry: pendingSummary ? 'resume' : 'start',
                            resumeStage,
                        })
                    }
                >
                    {t(
                        pendingSummary
                            ? 'accountExport.banner.resume'
                            : 'accountExport.banner.export'
                    )}
                </BannerLink>
            </AccountExportBannerContent>
        </AccountExportBannerContainer>
    );
}
