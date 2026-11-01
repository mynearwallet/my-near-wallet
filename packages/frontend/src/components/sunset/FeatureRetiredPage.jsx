import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import {
    METEOR_WALLET_SITE_URL,
    SUNSET_LEARN_MORE_URL,
    SUNSET_PHASE,
} from '../../config/sunset';
import { selectAccountId } from '../../redux/slices/account';
import { KEY_ACTIVE_ACCOUNT_ID } from '../../utils/wallet';
import AccountExportNotice from '../account-export/AccountExportNotice';
import useMigrationEntry from '../account-export/useMigrationEntry';
import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';
import AccountId from '../receive-money/components/AccountId';
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

    .account-id {
        margin-top: 24px;
        text-align: left;
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

const readActiveAccountId = () => {
    try {
        return localStorage.getItem(KEY_ACTIVE_ACCOUNT_ID) || '';
    } catch {
        return '';
    }
};

export const hasActiveAccount = () => !!readActiveAccountId();

/**
 * What a retired feature shows instead of itself: why it is gone, that funds are safe, and the
 * way forward, which is migrating for a signed-in user or getting Meteor Wallet for a guest.
 */
export default function FeatureRetiredPage({ capability, route }) {
    const { t } = useTranslation();
    const history = useHistory();
    const heading = useRef(null);
    const migration = useMigrationEntry();
    const phase3Date = usePhase3Date();
    const isSignedIn = hasActiveAccount();
    // Retired pages skip the sign-in guards, so the account may not be loaded into state yet.
    const accountId = useSelector(selectAccountId) || readActiveAccountId();

    useEffect(() => {
        heading.current?.focus({ preventScroll: true });
        trackSunsetFeatureBlocked({ capability, entry: 'route', route });
    }, [capability, route]);

    const onCta = (cta, action) => () => {
        trackSunsetRetiredCtaClicked({ capability, cta });
        action();
    };

    // A hint written for Phase 2 can name something that ends in Phase 3, so Phase 3 prefers its
    // own wording where one exists.
    const hintKey = `sunset.retired.${capability}.hint`;
    const notices = [
        t(
            SUNSET_PHASE >= 3
                ? [`sunset.retired.${capability}.phase3Hint`, hintKey]
                : hintKey,
            { date: phase3Date }
        ),
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
            <h2>
                {t(
                    SUNSET_PHASE >= 3
                        ? ['sunset.retired.phase3Body', 'sunset.retired.body']
                        : 'sunset.retired.body'
                )}
            </h2>
            <AccountExportNotice variant='info'>
                {notices.map((notice) => (
                    <p key={notice}>{notice}</p>
                ))}
            </AccountExportNotice>
            {/* The address stays the same in any wallet, so receiving users still need it. */}
            {capability === 'receive' && accountId && (
                <div className='account-id'>
                    <AccountId accountId={accountId} />
                </div>
            )}
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
                    <FormButton
                        onClick={onCta('get_meteor', () =>
                            window.open(
                                METEOR_WALLET_SITE_URL,
                                '_blank',
                                'noopener,noreferrer'
                            )
                        )}
                    >
                        {t('sunset.common.getMeteor')}
                    </FormButton>
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
