import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { METEOR_WALLET_SITE_URL, SUNSET_PHASE } from '../../config/sunset';
import { selectAccountLocalStorageAccountId } from '../../redux/slices/account';
import { selectPasswordProtectionSlice } from '../../redux/slices/passwordProtectedWallet/passwordProtectedWallet';
import useMigrationEntry from '../account-export/useMigrationEntry';
import Container from '../common/styled/Container.css';
import {
    trackSunsetBarCtaClicked,
    trackSunsetNoticeCtaClicked,
    trackSunsetNoticeShown,
} from './sunsetAnalytics';
import { usePhase3Date } from './sunsetDates';
import {
    hasOwnSunsetNotice,
    isSunsetImportPath,
    isSunsetPromptFreePath,
    normalizePathname,
} from './sunsetRoutes';
import SunsetIcon from './SunsetIcon';
import useNewBuildAvailable from './useNewBuildAvailable';

const BarContainer = styled(Container)`
    &&& {
        margin-top: 16px;
        margin-bottom: -8px;
    }
`;

const Bar = styled.div`
    align-items: center;
    background: linear-gradient(105deg, #ffd39a 0%, #ffe5bb 100%);
    border-radius: 12px;
    display: flex;
    gap: 14px;
    padding: 12px 16px 12px 14px;

    .bar-text {
        color: #000;
        flex: 1;
        font-size: 14px;
        line-height: 21px;
        margin: 0;
        min-width: 0;

        strong {
            font-weight: 700;
        }
    }

    .bar-cta {
        align-items: center;
        background: #fff;
        border: 0;
        border-radius: 50px;
        cursor: pointer;
        font-family: inherit;
        color: #0072ce;
        display: flex;
        flex: none;
        font-size: 14px;
        font-weight: 700;
        height: 36px;
        justify-content: center;
        padding: 0 18px;
        white-space: nowrap;

        &:hover {
            background: #f5f8ff;
            color: #0063b4;
        }
    }

    @media (max-width: 600px) {
        flex-wrap: wrap;

        .bar-cta {
            width: 100%;
        }
    }
`;

/**
 * The compact sunset reminder on every signed-in page except home (which has the full banner),
 * the migration flow itself and dApp requests. Reads only the local transfer journal, so it adds
 * no network traffic to the page. In limited mode the import screens show an import variant
 * instead, to signed-out visitors too. Once a newer build is live, every page shows the reload
 * variant instead, so a tab left open across a phase deployment doesn't keep the old phase.
 */
export default function SunsetBar() {
    const { t } = useTranslation();
    const { pathname } = useLocation();
    const accountId = useSelector(selectAccountLocalStorageAccountId);
    const { dataStatus, isSignedIn } = useSelector(selectPasswordProtectionSlice);
    const phase3Date = usePhase3Date();
    const isNewBuildAvailable = useNewBuildAvailable();

    if (isNewBuildAvailable) {
        return <SunsetReloadBar t={t} />;
    }

    const isLocked = dataStatus?.hasEncryptedData && !isSignedIn;
    const isHome = normalizePathname(pathname) === '/';

    // Import screens sit behind the unlock screen, so wait until it is out of the way.
    if (SUNSET_PHASE >= 3 && isSunsetImportPath(pathname) && !isLocked) {
        return <SunsetImportBar t={t} />;
    }

    const hidden =
        SUNSET_PHASE < 2 ||
        !accountId ||
        isLocked ||
        isHome ||
        isSunsetPromptFreePath(pathname) ||
        hasOwnSunsetNotice(pathname);

    if (hidden) {
        return null;
    }

    return <SunsetBarContent t={t} phase3Date={phase3Date} />;
}

function SunsetReloadBar({ t }) {
    useEffect(() => {
        trackSunsetNoticeShown({ variant: 'reload_bar' });
    }, []);

    return (
        <BarContainer>
            <Bar role='status'>
                <SunsetIcon size={32} />
                <p className='bar-text'>
                    <strong>{t('sunset.bar.reload.title')}</strong>{' '}
                    {t('sunset.bar.reload.description')}
                </p>
                <button
                    type='button'
                    className='bar-cta'
                    onClick={() => {
                        trackSunsetNoticeCtaClicked({
                            variant: 'reload_bar',
                            cta: 'reload',
                        });
                        window.location.reload();
                    }}
                >
                    {t('sunset.bar.reload.cta')}
                </button>
            </Bar>
        </BarContainer>
    );
}

function SunsetImportBar({ t }) {
    return (
        <BarContainer>
            <Bar role='note'>
                <SunsetIcon size={32} />
                <p className='bar-text'>
                    <strong>{t('sunset.bar.import.title')}</strong>{' '}
                    {t('sunset.bar.import.description')}
                </p>
                <a
                    className='bar-cta'
                    href={METEOR_WALLET_SITE_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    onClick={() =>
                        trackSunsetNoticeCtaClicked({
                            variant: 'import_bar',
                            cta: 'get_meteor',
                        })
                    }
                >
                    {t('sunset.common.getMeteor')}
                </a>
            </Bar>
        </BarContainer>
    );
}

// Split out so the transfer journal is only read on pages that show the bar.
function SunsetBarContent({ t, phase3Date }) {
    const migration = useMigrationEntry();
    const copy = SUNSET_PHASE >= 3 ? 'sunset.bar.phase3' : 'sunset.bar.phase2';

    return (
        <BarContainer>
            <Bar role='note'>
                <SunsetIcon size={32} />
                <p className='bar-text'>
                    <strong>{t(`${copy}.title`, { date: phase3Date })}</strong>{' '}
                    {t(`${copy}.description`)}
                </p>
                <Link
                    className='bar-cta'
                    to={migration.to}
                    onClick={() =>
                        trackSunsetBarCtaClicked({
                            entry: migration.isResume ? 'resume' : 'start',
                        })
                    }
                >
                    {t(migration.isResume ? 'sunset.common.resume' : 'sunset.bar.cta')}
                </Link>
            </Bar>
        </BarContainer>
    );
}
