import React from 'react';
import { useTranslation } from 'react-i18next';
import { Translate } from 'react-localize-redux';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

import { SUNSET_PHASE } from '../../config/sunset';
import { Mixpanel } from '../../mixpanel/index';
import { GleapService } from '../../services/gleap/gleap.service';
import useMigrationEntry from '../account-export/useMigrationEntry';
import ExploreIcon from '../svg/ExploreIcon';
import HelpIcon from '../svg/HelpIcon';
import MigrateIcon from '../svg/MigrateIcon';
import UserIcon from '../svg/UserIcon';
import VaultIcon from '../svg/VaultIcon';
import WalletIcon from '../svg/WalletIcon';

const Container = styled.div`
    display: flex;
    width: 100%;

    button {
        all: unset;
    }

    a,
    .nav-button {
        display: flex;
        align-items: center;
        cursor: pointer;
        transition: 100ms;
        color: #72727a;
        font-size: 15px;
        white-space: nowrap;

        :hover,
        &.selected {
            text-decoration: none;
            color: #272729;

            svg {
                path,
                circle,
                line {
                    stroke: #0072ce;
                }

                &.user-icon {
                    path {
                        stroke: #0072ce;
                        fill: #0072ce;

                        :last-of-type {
                            fill: none;
                        }
                    }
                }
            }
        }
    }

    svg {
        margin-right: 10px;
        width: 23px;
        height: 23px;

        &.user-icon {
            width: 35px;
            height: 35px;
            margin-right: 4px;
            stroke-width: 0px;
        }
    }

    .usn-button {
        margin-left: auto;
        margin-right: 20px;
        height: 35px;
        padding: 5px 15px 5px 5px;
        border-radius: 20px;
        background: #d6edff;
        font-weight: 600;
        color: black;
        white-space: nowrap;

        :hover {
            background: #0072ce;
            color: white;
        }

        img {
            margin-right: 10px;
            margin-top: 2px;
            width: 25px;
            height: 25px;
        }
    }

    @media (max-width: 991px) {
        flex-direction: column;
        align-items: flex-start;
    }

    @media (min-width: 992px) {
        align-items: center;
        margin-left: 10px;

        a,
        .nav-button {
            margin-left: 25px;

            &.account-details-link {
                margin-left: 20px;
            }
        }
    }
`;

const isMigrationPath = (match, location) =>
    location.pathname.startsWith('/export-accounts');

const MigrateNavLink = () => {
    const { t } = useTranslation();
    const { to } = useMigrationEntry();

    return (
        <NavLink
            data-test-id='migrate_navlink'
            to={to}
            isActive={isMigrationPath}
            activeClassName='selected'
            onClick={() => Mixpanel.track('Click Migrate button on nav')}
        >
            <MigrateIcon />
            {t('sunset.nav.migrate')}
        </NavLink>
    );
};

const NavLinks = () => (
    <Container className='nav-links'>
        <NavLink
            exact
            to='/'
            activeClassName='selected'
            onClick={() => Mixpanel.track('Click Wallet button on nav')}
        >
            <WalletIcon />
            <Translate id='link.wallet' />
        </NavLink>
        <NavLink
            data-test-id='staking_navlink'
            to='/staking'
            activeClassName='selected'
            onClick={() => Mixpanel.track('Click Staking button on nav')}
        >
            <VaultIcon />
            <Translate id='link.staking' />
        </NavLink>
        {/* From Phase 2 the Explore slot points users at migration instead. */}
        {SUNSET_PHASE >= 2 ? (
            <MigrateNavLink />
        ) : (
            <NavLink
                data-test-id='explore_navlink'
                to='/explore'
                activeClassName='selected'
                onClick={() => Mixpanel.track('Click Explore button on nav')}
            >
                <ExploreIcon />
                <Translate id='link.explore' />
            </NavLink>
        )}
        <NavLink
            to='/profile'
            className='account-details-link'
            activeClassName='selected'
            onClick={() => Mixpanel.track('Click Account button on nav')}
        >
            <UserIcon />
            <Translate id='link.account' />
        </NavLink>
        <button
            className={'nav-button'}
            rel='noopener noreferrer'
            onClick={() => {
                GleapService.open();
                Mixpanel.track('Click Support button on nav');
            }}
        >
            <HelpIcon />
            <Translate id='link.support' />
        </button>
    </Container>
);

export default NavLinks;
