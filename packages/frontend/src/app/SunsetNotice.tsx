import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import useMigrationEntry from '../components/account-export/useMigrationEntry';
import FormButton from '../components/common/FormButton';
import FormButtonGroup from '../components/common/FormButtonGroup';
import Modal from '../components/common/modal/Modal';
import {
    trackSunsetNoticeCtaClicked,
    trackSunsetNoticeShown,
} from '../components/sunset/sunsetAnalytics';
import { usePhase3Date } from '../components/sunset/sunsetDates';
import { isSunsetPromptFreePath } from '../components/sunset/sunsetRoutes';
import SunsetIcon from '../components/sunset/SunsetIcon';
import { SUNSET_LEARN_MORE_URL, SUNSET_PHASE } from '../config/sunset';
import { selectAccountLocalStorageAccountId } from '../redux/slices/account';
import { selectPasswordProtectionSlice } from '../redux/slices/passwordProtectedWallet/passwordProtectedWallet';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How often each phase may show the notice. Each phase has its own key, so moving to a new phase
 * shows its notice straight away. Phase 3 shows once per browser session.
 */
const CADENCE = {
    1: { storage: 'local', key: 'sunsetNoticeLastShownAt', intervalMs: 4 * DAY_MS },
    2: { storage: 'local', key: 'sunsetNoticeLastShownAt:phase2', intervalMs: DAY_MS },
    3: { storage: 'session', key: 'sunsetNoticeShown:phase3', intervalMs: Infinity },
} as const;

const Container = styled.div`
    text-align: left;

    .title {
        font-weight: 600;
        font-size: 20px;
        color: #24272a;
        margin: 16px 0 20px;
    }

    .body {
        color: #72727a;
        font-size: 15px;
        line-height: 1.5;

        p {
            margin: 0 0 14px;
        }
    }

    .anti-phishing {
        color: #72727a;
        font-size: 13px;
        line-height: 1.5;
        margin: 0;
    }

    .divider {
        border: none;
        border-top: 1px solid #f0f0f1;
        margin: 16px 0 20px;
    }
`;

function cadenceStore() {
    const cadence = CADENCE[SUNSET_PHASE];
    const storage = cadence.storage === 'session' ? sessionStorage : localStorage;
    return { cadence, storage };
}

function shouldShowNotice() {
    try {
        const { cadence, storage } = cadenceStore();
        const lastShownAt = Number(storage.getItem(cadence.key));
        if (!lastShownAt || Number.isNaN(lastShownAt)) {
            return true;
        }
        return Date.now() - lastShownAt > cadence.intervalMs;
    } catch {
        return false;
    }
}

function recordShown() {
    try {
        const { cadence, storage } = cadenceStore();
        storage.setItem(cadence.key, String(Date.now()));
    } catch {
        // Ignore storage failures (e.g. private mode) and still show once.
    }
}

export default function SunsetNotice() {
    const { pathname } = useLocation();
    const { dataStatus, isSignedIn } = useSelector(selectPasswordProtectionSlice);
    const [isOpen, setIsOpen] = useState(false);

    const isLocked = dataStatus?.hasEncryptedData && !isSignedIn;
    const canShowHere = !isLocked && !isSunsetPromptFreePath(pathname);

    useEffect(() => {
        if (!isOpen && canShowHere && shouldShowNotice()) {
            recordShown();
            setIsOpen(true);
            trackSunsetNoticeShown({ variant: `phase${SUNSET_PHASE}` });
        }
    }, [canShowHere]);

    if (!isOpen) {
        return null;
    }

    return <SunsetNoticeModal onClose={() => setIsOpen(false)} />;
}

function SunsetNoticeModal({ onClose }) {
    const { t } = useTranslation();
    const history = useHistory();
    const migration = useMigrationEntry();
    const phase3Date = usePhase3Date();
    const isSignedIn = !!useSelector(selectAccountLocalStorageAccountId);
    const copy = `sunset.notice.phase${SUNSET_PHASE}`;
    const variant = `phase${SUNSET_PHASE}`;
    const paragraphs = ['p1', 'p2', 'p3']
        .map((key) => t(`${copy}.${key}`, { date: phase3Date, defaultValue: '' }))
        .filter(Boolean);
    const offerMigration = SUNSET_PHASE >= 2 && isSignedIn;

    return (
        // @ts-ignore — Modal is a JS component without full prop typings
        <Modal id='modal-sunset-notice' isOpen onClose={onClose} modalSize='sm'>
            <Container>
                <SunsetIcon />
                <h3 className='title'>{t(`${copy}.title`, { date: phase3Date })}</h3>
                <hr className='divider' />
                <div className='body'>
                    {paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                    ))}
                </div>
                {SUNSET_PHASE >= 2 && (
                    <p className='anti-phishing'>{t('sunset.notice.antiPhishing')}</p>
                )}
                <FormButtonGroup>
                    <FormButton
                        color='gray-blue'
                        className='border'
                        onClick={() => {
                            trackSunsetNoticeCtaClicked({ variant, cta: 'learn_more' });
                            window.open(
                                SUNSET_LEARN_MORE_URL,
                                '_blank',
                                'noopener,noreferrer'
                            );
                        }}
                    >
                        {t('sunset.notice.learnMore')}
                    </FormButton>
                    {offerMigration ? (
                        <FormButton
                            onClick={() => {
                                trackSunsetNoticeCtaClicked({ variant, cta: 'migrate' });
                                onClose();
                                history.push(migration.to);
                            }}
                        >
                            {t(
                                migration.isResume
                                    ? 'sunset.common.resume'
                                    : 'sunset.notice.migrateNow'
                            )}
                        </FormButton>
                    ) : (
                        <FormButton
                            onClick={() => {
                                trackSunsetNoticeCtaClicked({ variant, cta: 'continue' });
                                onClose();
                            }}
                        >
                            {t('sunset.notice.continue')}
                        </FormButton>
                    )}
                </FormButtonGroup>
            </Container>
        </Modal>
    );
}
