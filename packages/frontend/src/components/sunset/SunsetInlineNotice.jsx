import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { METEOR_WALLET_SITE_URL, SUNSET_PHASE } from '../../config/sunset';
import AccountExportNotice from '../account-export/AccountExportNotice';
import useMigrationEntry from '../account-export/useMigrationEntry';
import Container from '../common/styled/Container.css';
import { usePhase3Date } from './sunsetDates';

const NoticeWrapper = styled.div`
    text-align: left;

    a {
        color: inherit;
        font-weight: 600;
        text-decoration: underline;
        white-space: nowrap;
    }

    &.compact section {
        margin: 16px 0 24px;
    }
`;

const CenteredContainer = styled(Container)`
    &&& {
        margin-bottom: -16px;
    }
`;

/**
 * A contextual sunset message for pages whose feature still works but is going away. Renders
 * nothing before `minPhase` (Phase 2 by default). `migrateLink` opens the migration flow in a new
 * tab where the page must not be left (dApp approvals in a popup), or links to Meteor Wallet
 * instead (`'meteor'`) where the reader may have no account here. `centered` sizes it like the
 * bordered request cards it sits above.
 */
export default function SunsetInlineNotice({
    messageKey,
    values,
    migrateLink = 'same-tab',
    compact = false,
    centered = false,
    minPhase = 2,
}) {
    const { t } = useTranslation();
    const phase3Date = usePhase3Date();

    if (SUNSET_PHASE < minPhase) {
        return null;
    }

    const notice = (
        <NoticeWrapper className={compact || centered ? 'compact' : undefined}>
            <AccountExportNotice variant='info'>
                <p>
                    {t(messageKey, { date: phase3Date, ...values })}
                    {migrateLink === 'meteor' ? (
                        <>
                            {' '}
                            <a
                                href={METEOR_WALLET_SITE_URL}
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                {t('sunset.common.getMeteor')}
                            </a>
                        </>
                    ) : (
                        migrateLink !== 'none' && (
                            <>
                                {' '}
                                <MigrateLink newTab={migrateLink === 'new-tab'} t={t} />
                            </>
                        )
                    )}
                </p>
            </AccountExportNotice>
        </NoticeWrapper>
    );

    return centered ? (
        <CenteredContainer className='small-centered'>{notice}</CenteredContainer>
    ) : (
        notice
    );
}

function MigrateLink({ newTab, t }) {
    const { to, href } = useMigrationEntry();

    if (newTab) {
        return (
            <a href={href} target='_blank' rel='noopener noreferrer'>
                {t('sunset.inline.migrateLink')}
            </a>
        );
    }

    return <Link to={to}>{t('sunset.inline.migrateLink')}</Link>;
}
