import React, { FC, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next'

import { Mixpanel } from '../../mixpanel/index';
import isMobile from '../../utils/isMobile';
import LangSwitcher from '../common/LangSwitcher';
import ExploreIcon from '../svg/ExploreIcon';
import HelpIcon from '../svg/HelpIcon';
import UserIcon from '../svg/UserIcon';
import VaultIcon from '../svg/VaultIcon';
import WalletIcon from '../svg/WalletIcon';
import DesktopMenu from './DesktopMenu';
import Logo from './Logo';
import {
    StyledHeader,
    StyledTop,
    StyledNavigation,
    StyledLinks,
    StyledNavItem,
    StyledFooter,
    StyledLangSelector,
} from './ui';
import UserAccount from './UserAccount';

const track = (msg: string) => Mixpanel.track(msg);

const routes = [
    {
        nameId: 'link.wallet',
        route: '/',
        trackMsg: 'Click Wallet button on nav',
        icon: <WalletIcon />,
    },
    {
        nameId: 'link.staking',
        route: '/staking',
        trackMsg: 'Click Staking button on nav',
        icon: <VaultIcon />,
        testId: 'staking_navlink',
    },
    {
        nameId: 'link.explore',
        route: '/explore',
        trackMsg: 'Click Explore button on nav',
        icon: <ExploreIcon />,
        testId: 'explore_navlink',
    },
    {
        nameId: 'link.account',
        route: '/profile',
        trackMsg: 'Click Account button on nav',
        icon: <UserIcon />,
    },
];

const links = [
    {
        nameId: 'link.help',
        link: 'https://support.mynearwallet.com/en',
        trackMsg: 'Click Help button on nav',
        icon: <HelpIcon />,
    }
];

const isMobileDevice = isMobile();

type NavigationProps = {
    accounts: string[];
    currentAccount: {
        accountId: string;
        accountsBalance: any;
        localStorage: {
            accountFound: boolean;
            accountId: string;
        };
    };
    selectAccount: (accountId: string) => void;
    refreshBalance: (accountId: string) => void;
};

const Navigation: FC<NavigationProps> = ({
    accounts,
    currentAccount,
    selectAccount,
    refreshBalance,
}) => {
    const { t } = useTranslation()
    const { accountId, accountsBalance, localStorage } = currentAccount;
    const [isNavigationOpen, setIsNavigationOpen] = useState(!isMobileDevice);
    const [isAccountMenuVisible, setIsAccountMenuVisible] = useState(isMobileDevice);

    const toggleNavigation = () => {
        if (isMobileDevice) {
            setIsNavigationOpen(!isNavigationOpen);
        }
    };

    const handleAccountClick = () => {
        if (isMobileDevice) {
            setIsNavigationOpen(!isNavigationOpen);
        } else {
            // TODO: add outside click hook
            setIsAccountMenuVisible(!isAccountMenuVisible);
        }
    };

    const isContentVisible = !isMobileDevice || isNavigationOpen;

    return (
        <StyledHeader id="nav-container">
            <StyledTop>
                <Logo mode={isMobileDevice ? 'mobile' : undefined} link />
                <UserAccount
                    accountId={accountId || localStorage?.accountId}
                    onClick={handleAccountClick}
                    withIcon={!isMobileDevice}
                />
                {isMobileDevice && <UserIcon onClick={toggleNavigation} background />}
            </StyledTop>

            <StyledNavigation hidden={!isContentVisible}>
                {/* @todo move to a separate component OR update NavLinks.js */}
                <StyledLinks>
                    {routes.map(({ nameId, route, trackMsg, icon, testId = '' }, index) => (
                        <StyledNavItem key={index}>
                            <NavLink
                                exact
                                to={route}
                                onClick={() => track(trackMsg)}
                                data-test-id={testId}
                                className="link"
                            >
                                {icon}
                                <span className="name">
                                    {t(nameId)}
                                </span>
                            </NavLink>
                        </StyledNavItem>
                    ))}
                    {links.map(({ nameId, link, trackMsg, icon }, index) => (
                        <StyledNavItem key={index}>
                            <a
                                href={link}
                                target='_blank'
                                rel='noopener noreferrer'
                                className="link"
                                onClick={() => track(trackMsg)}
                            >
                                {icon}
                                <span className="name">
                                    {t(nameId)}
                                </span>
                            </a>
                        </StyledNavItem>
                    ))}
                </StyledLinks>

                <StyledFooter showDivider={!isMobileDevice}>
                    <StyledLangSelector>
                        <LangSwitcher />
                    </StyledLangSelector>
                    {/* TODO: rename with smth like "AccountMenu" */}
                    <DesktopMenu
                        show={isAccountMenuVisible}
                        accounts={accounts}
                        handleSelectAccount={selectAccount}
                        accountIdLocalStorage={localStorage?.accountId}
                        accountsBalance={accountsBalance}
                        refreshBalance={refreshBalance}
                    />
                </StyledFooter>
            </StyledNavigation>
        </StyledHeader>
    );
};

export default Navigation;
