import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { SUNSET_LEARN_MORE_URL, SUNSET_PHASE } from '../../config/sunset';
import { trackMigrationEntryClicked } from '../account-export/accountExportAnalytics';
import useMigrationEntry from '../account-export/useMigrationEntry';
import { trackSunsetNoticeCtaClicked } from '../sunset/sunsetAnalytics';
import { usePhase3Date } from '../sunset/sunsetDates';

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

const BannerActions = styled.div`
    display: flex;
    flex: none;
    flex-direction: column;
    gap: 10px;
    margin-left: 32px;
    min-width: 250px;

    @media (max-width: 600px) {
        margin: 20px 0 0;
        min-width: 0;
        width: 100%;
    }
`;

const BannerSecondaryAction = styled.a`
    align-items: center;
    background: rgba(255, 255, 255, 0.45);
    border-radius: 50px;
    color: #24272a;
    display: flex;
    font-size: 14px;
    font-weight: 600;
    height: 40px;
    justify-content: center;
    line-height: 21px;
    text-align: center;
    text-decoration: none;

    &:hover {
        background: rgba(255, 255, 255, 0.7);
        color: #24272a;
        text-decoration: none;
    }
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
    text-align: center;

    &:hover {
        background: #f5f8ff;
        border-color: #f5f8ff;
        color: #0063b4;
    }
`;

export default function AccountExportBanner() {
    const { t } = useTranslation();
    const phase3Date = usePhase3Date();
    const { to, isResume, resumeStage } = useMigrationEntry();
    const copy =
        SUNSET_PHASE >= 3
            ? 'sunset.banner.phase3'
            : SUNSET_PHASE === 2
            ? 'sunset.banner.phase2'
            : null;

    return (
        <AccountExportBannerContainer>
            <AccountExportBannerContent>
                <BannerCopy>
                    <BannerTitle>
                        {copy
                            ? t(`${copy}.title`, { date: phase3Date })
                            : t('accountExport.banner.title')}
                    </BannerTitle>
                    <BannerDescription>
                        {copy
                            ? t(`${copy}.description`, { date: phase3Date })
                            : t('accountExport.banner.description')}
                    </BannerDescription>
                </BannerCopy>
                <BannerActions>
                    <BannerLink
                        to={to}
                        onClick={() =>
                            trackMigrationEntryClicked({
                                entry: isResume ? 'resume' : 'start',
                                resumeStage,
                            })
                        }
                    >
                        {t(
                            isResume
                                ? 'accountExport.banner.resume'
                                : copy
                                ? 'sunset.banner.cta'
                                : 'accountExport.banner.export'
                        )}
                    </BannerLink>
                    {copy && (
                        <BannerSecondaryAction
                            href={SUNSET_LEARN_MORE_URL}
                            target='_blank'
                            rel='noopener noreferrer'
                            onClick={() =>
                                trackSunsetNoticeCtaClicked({
                                    variant: 'home_banner',
                                    cta: 'learn_more',
                                })
                            }
                        >
                            {t('sunset.common.learnMore')}
                        </BannerSecondaryAction>
                    )}
                </BannerActions>
            </AccountExportBannerContent>
        </AccountExportBannerContainer>
    );
}
