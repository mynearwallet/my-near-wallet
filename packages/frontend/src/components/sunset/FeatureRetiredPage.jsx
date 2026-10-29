import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { SUNSET_LEARN_MORE_URL } from '../../config/sunset';
import { resolveMeteorWalletWebUrl } from '../../services/meteorConnectEnvironment';
import { KEY_ACTIVE_ACCOUNT_ID } from '../../utils/wallet';
import AccountExportNotice from '../account-export/AccountExportNotice';
import useMigrationEntry from '../account-export/useMigrationEntry';
import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';
import {
    trackSunsetFeatureBlocked,
    trackSunsetRetiredCtaClicked,
} from './sunsetAnalytics';
import { usePhase3Date } from './sunsetDates';
import SunsetIcon from './SunsetIcon';

const RetiredPage = styled(Container)`
    &&& {
        text-align: center;

        h1 {
            margin-top: 20px;
            outline: none;
        }

        h1,
        h2 {
            text-align: center !important;
        }
    }

    .retired-notice {
        margin: 28px 0 0;
    }
`;

const Buttons = styled.div`
    margin-top: 40px;

    > button {
        width: 100%;
    }

    .secondary {
        margin-top: 8px;

        > button {
            width: 100%;
        }
    }

    .learn-more {
        display: inline-block;
        font-size: 14px;
        margin-top: 16px;
    }
`;

export const hasActiveAccount = () => {
    try {
        return !!localStorage.getItem(KEY_ACTIVE_ACCOUNT_ID);
    } catch {
        return false;
    }
};

/**
 * What a retired feature shows instead of itself: why it is gone, that funds are safe, and the
 * way forward, which is migrating for a signed-in user or importing for a guest.
 */
export default function FeatureRetiredPage({ capability, route }) {
    const { t } = useTranslation();
    const history = useHistory();
    const heading = useRef(null);
    const migration = useMigrationEntry();
    const phase3Date = usePhase3Date();
    const isSignedIn = hasActiveAccount();

    useEffect(() => {
        heading.current?.focus({ preventScroll: true });
        trackSunsetFeatureBlocked({ capability, entry: 'route', route });
    }, [capability, route]);

    const onCta = (cta, action) => () => {
        trackSunsetRetiredCtaClicked({ capability, cta });
        action();
    };

    const notices = [
        t(`sunset.retired.${capability}.hint`, { date: phase3Date }),
        capability === 'createAccount'
            ? t('sunset.retired.createAccount.fundedHint')
            : null,
    ].filter(Boolean);

    return (
        <RetiredPage className='small-centered'>
            <SunsetIcon size={48} centered />
            <h1 ref={heading} tabIndex={-1}>
                {t(`sunset.retired.${capability}.title`)}
            </h1>
            <h2>{t('sunset.retired.body')}</h2>
            <AccountExportNotice variant='info'>
                {notices.map((notice) => (
                    <p key={notice}>{notice}</p>
                ))}
            </AccountExportNotice>
            <Buttons>
                {isSignedIn ? (
                    <>
                        <FormButton
                            onClick={onCta('migrate', () => history.push(migration.to))}
                        >
                            {t(
                                migration.isResume
                                    ? 'sunset.common.resume'
                                    : 'sunset.common.migrate'
                            )}
                        </FormButton>
                        <div className='secondary'>
                            <FormButton
                                className='link'
                                color='gray'
                                onClick={onCta('back', () => history.push('/'))}
                            >
                                {t('sunset.common.backToWallet')}
                            </FormButton>
                        </div>
                    </>
                ) : (
                    <>
                        <FormButton
                            onClick={onCta('import', () =>
                                history.push('/recover-account')
                            )}
                        >
                            {t('sunset.common.importExisting')}
                        </FormButton>
                        <div className='secondary'>
                            <FormButton
                                className='link'
                                color='gray'
                                onClick={onCta('get_meteor', () =>
                                    window.open(
                                        resolveMeteorWalletWebUrl(
                                            window.location.hostname
                                        ),
                                        '_blank',
                                        'noopener,noreferrer'
                                    )
                                )}
                            >
                                {t('sunset.common.getMeteor')}
                            </FormButton>
                        </div>
                    </>
                )}
                <a
                    className='learn-more'
                    href={SUNSET_LEARN_MORE_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    onClick={() =>
                        trackSunsetRetiredCtaClicked({ capability, cta: 'learn_more' })
                    }
                >
                    {t('sunset.common.whyIsThisHappening')}
                </a>
            </Buttons>
        </RetiredPage>
    );
}
