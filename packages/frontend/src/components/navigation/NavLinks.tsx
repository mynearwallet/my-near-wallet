import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { Mixpanel } from '../../mixpanel/index';
import ExploreIcon from '../svg/ExploreIcon';
import HelpIcon from '../svg/HelpIcon';
import StakingIcon from '../svg/StakingIcon';
import UserIcon from '../svg/UserIcon';
import WalletIcon from '../svg/WalletIcon';
import { StyledLinks, StyledNavItem } from './ui';

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
        icon: <StakingIcon />,
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
    },
];

const NavLinks: FC = () => {
    const { t } = useTranslation();

    return (
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
                        <span className="name">{t(nameId)}</span>
                    </NavLink>
                </StyledNavItem>
            ))}
            {links.map(({ nameId, link, trackMsg, icon }, index) => (
                <StyledNavItem key={index}>
                    <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link"
                        onClick={() => track(trackMsg)}
                    >
                        {icon}
                        <span className="name">{t(nameId)}</span>
                    </a>
                </StyledNavItem>
            ))}
        </StyledLinks>
    );
};

export default NavLinks;
