import React, { FC, useState } from 'react';
import { Translate } from 'react-localize-redux';
import { NavLink } from 'react-router-dom';

import { Mixpanel } from '../../mixpanel/index';
import isMobile from '../../utils/isMobile';
import LangSwitcher from '../common/LangSwitcher';
import ExploreIcon from '../svg/ExploreIcon';
// import HelpIcon from '../svg/HelpIcon';
import UserIcon from '../svg/UserIcon';
import VaultIcon from '../svg/VaultIcon';
import WalletIcon from '../svg/WalletIcon';
import Logo from './Logo';
import {
    StyledNavigation,
    StyledHeader,
    StyledLinks,
    StyledNavItem,
    StyledFooter,
    StyledDivider,
} from './ui';
import UserAccount from './UserAccount';

const track = (msg: string) => Mixpanel.track(msg);

const links = [
    {
        nameId: 'link.wallet',
        link: '/',
        trackMsg: 'Click Wallet button on nav',
        icon: <WalletIcon />,
        testId: '',
    },
    {
        nameId: 'link.staking',
        link: '/staking',
        trackMsg: 'Click Staking button on nav',
        icon: <VaultIcon />,
        testId: 'staking_navlink',
    },
    {
        nameId: 'link.explore',
        link: '/explore',
        trackMsg: 'Click Explore button on nav',
        icon: <ExploreIcon />,
        testId: '',
    },
    {
        nameId: 'link.account',
        link: '/profile',
        trackMsg: 'Click Account button on nav',
        icon: <UserIcon />,
        testId: '',
    },
    // {
    //     nameId: 'link.help',
    //     link: 'https://support.mynearwallet.com/en',
    //     trackMsg: 'Click Help button on nav',
    //     icon: <HelpIcon/>,
    //     testId: '',
    // }
];

const isMobileDevice = isMobile();

type NavigationProps = {
    selectAccount: any;
    accounts: any;
    currentAccount: any;
};

const Navigation: FC<NavigationProps> = ({
    selectAccount,
    // flowLimitationMainMenu,
    // flowLimitationSubMenu,
    accounts,
    currentAccount,
}) => {
    const { accountId, localStorage } = currentAccount;
    const [isNavigationOpen, setIsNavigationOpen] = useState(!isMobileDevice);

    const toggleNavigation = () => {
        if (isMobileDevice) {
            setIsNavigationOpen(!isNavigationOpen);
        }
    };

    /* 
    Desktop: 
    - vertical layout
    - always display
    Order:
    - logo + (account btn (trigger only accounts display) & accounts (hidden) in absolute)
    - nav links
    - devider
    - support link
    - lang switcher

    Mobile:
    - vertical layout
    - condition display (header is always)
    Order:
    - logo + account btn (trigger whole navigation display)
    - nav links
    - support link
    - lang swticher
    - accounts (always visible)
    */

    return (
        <StyledNavigation id="nav-container">
            <StyledHeader>
                <Logo mode={isMobileDevice ? 'mobile' : undefined} link />
                <UserAccount
                    accountId={accountId || localStorage?.accountId}
                    onClick={toggleNavigation}
                    withIcon={!isMobileDevice}
                    // TODO simplify prop name
                    flowLimitationSubMenu={!isMobileDevice}
                />
                {isMobileDevice && (
                    <UserIcon
                        background={true}
                        color="#A2A2A8"
                        onClick={toggleNavigation}
                    />
                )}
            </StyledHeader>

            {(!isMobileDevice || isNavigationOpen) && (
                <>
                    <StyledLinks>
                        {links.map(({ nameId, link, trackMsg, icon }, index) => (
                            <StyledNavItem key={index}>
                                <NavLink
                                    to={link}
                                    onClick={() => track(trackMsg)}
                                    data-test-id
                                >
                                    {icon}
                                    <Translate id={nameId} />
                                </NavLink>
                            </StyledNavItem>
                        ))}
                    </StyledLinks>

                    {!isMobileDevice && (
                        <StyledDivider />
                    )}

                    <StyledFooter>
                        <LangSwitcher />
                        {null
                            // account component with main actions + languages
                        }
                    </StyledFooter>
                </>
            )}
        </StyledNavigation>
    );
};

export default Navigation;
