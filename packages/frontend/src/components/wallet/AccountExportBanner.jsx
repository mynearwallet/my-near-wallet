import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { getMeteorNewKeyTransferSessions } from '../../services/meteorConnect';
import {
    findResumableNewKeyTransfer,
    summarizeNewKeyTransferSession,
} from '../../services/newKeyTransferState';

const AccountExportBannerContainer = styled.section`
    margin-bottom: 28px;
    margin-top: 16px;
`;

const AccountExportBannerContent = styled.div`
    align-items: center;
    background: linear-gradient(105deg, #6686f4 0%, #65bfe0 100%);
    border-radius: 16px;
    display: flex;
    justify-content: space-between;
    padding: 32px 42px;

    @media (max-width: 600px) {
        align-items: stretch;
        border-radius: 12px;
        flex-direction: column;
        padding: 16px 20px;
    }
`;

const BannerCopy = styled.div`
    color: #fff;
    max-width: 740px;
`;

const BannerTitle = styled.div`
    color: #fff;
    font-size: 20px;
    font-weight: 700;
    line-height: 26px;
    margin: 0;
`;

const BannerDescription = styled.div`
    color: #fff;
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
 * Where an unfinished transfer picks up. Once an AddKey intent is journaled the destination keys
 * may already be live on-chain, so resuming belongs on the activation screen — which asks the
 * journal what is actually left rather than re-offering keys that are already in flight.
 */
const resumeRoute = (summary) =>
    summary == null
        ? '/export-accounts/select'
        : {
              pathname: summary.hasAddKeyIntent
                  ? '/export-accounts/new-key-activation'
                  : '/export-accounts/new-key-ready',
              state: { clientTransferId: summary.clientTransferId },
          };

export default function AccountExportBanner() {
    const { t } = useTranslation();
    const [pendingSummary, setPendingSummary] = useState(null);

    useEffect(() => {
        let isActive = true;
        void (async () => {
            try {
                const sessions = await getMeteorNewKeyTransferSessions();
                const resumable = findResumableNewKeyTransfer(sessions);
                if (isActive) {
                    setPendingSummary(summarizeNewKeyTransferSession(resumable));
                }
            } catch {
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
                <BannerLink to={resumeRoute(pendingSummary)}>
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
