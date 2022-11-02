import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { Mixpanel } from '../../../mixpanel/index';
import ExploreIcon from '../../svg/ExploreIcon';
import StakingIcon from '../../svg/StakingIcon';
import UserIcon from '../../svg/UserIcon';
import WalletIcon from '../../svg/WalletIcon';
import { StyledLinks, StyledNavItem } from './index';

const track = (msg: string) => Mixpanel.track(msg);

const routes = [
    {
        nameId: 'link.wallet',
        route: '/',
        trackMsg: 'Click Wallet button on nav',
        icon: <WalletIcon color="var(--navigation-icon-color)" />,
        exact: true,
    },
    {
        nameId: 'link.staking',
        route: '/staking',
        trackMsg: 'Click Staking button on nav',
        icon: <StakingIcon color="var(--navigation-icon-color)" />,
        testId: 'staking_navlink',
    },
    {
        nameId: 'link.explore',
        route: '/explore',
        trackMsg: 'Click Explore button on nav',
        icon: <ExploreIcon color="var(--navigation-icon-color)" />,
        testId: 'explore_navlink',
    },
    {
        nameId: 'link.account',
        route: '/profile',
        trackMsg: 'Click Account button on nav',
        icon: <UserIcon color="var(--navigation-icon-color)" />,
        // @todo: need to fix display in UserIcon. It has to be different here,
        // but other components are perfectly fine with what we have now.
        brokenDisplay: true,
    },
];

const NavLinks: FC = () => {
    const { t } = useTranslation();

    return (
        <StyledLinks>
            {routes.map(
                (
                    {
                        nameId,
                        route,
                        trackMsg,
                        icon,
                        testId = '',
                        exact = false,
                        brokenDisplay = false,
                    },
                    index
                ) => (
                    <StyledNavItem key={index}>
                        <NavLink
                            to={route}
                            onClick={() => track(trackMsg)}
                            data-test-id={testId}
                            className={`link ${brokenDisplay ? 'brokenDisplay' : ''}`}
                            exact={exact}
                        >
                            {icon}
                            <span className="name">{t(nameId)}</span>
                        </NavLink>
                    </StyledNavItem>
                )
            )}
        </StyledLinks>
    );
};

export default NavLinks;
