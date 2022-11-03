import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { Mixpanel } from '../../../../mixpanel';
import ExploreIcon from '../../../../components/svg/ExploreIcon';
import StakingIcon from '../../../../components/svg/StakingIcon';
import UserIcon from '../../../../components/svg/UserIcon';
import WalletIcon from '../../../../components/svg/WalletIcon';
import { StyledLinks, StyledNavItem } from './ui';

const routes = [
    {
        nameId: 'wallet',
        route: '/',
        trackMsg: 'Click Wallet button on nav',
        icon: <WalletIcon color="var(--navigation-icon-color)" />,
        exact: true,
    },
    {
        nameId: 'staking',
        route: '/staking',
        trackMsg: 'Click Staking button on nav',
        icon: <StakingIcon color="var(--navigation-icon-color)" />,
        testId: 'staking_navlink',
    },
    {
        nameId: 'explore',
        route: '/explore',
        trackMsg: 'Click Explore button on nav',
        icon: <ExploreIcon color="var(--navigation-icon-color)" />,
        testId: 'explore_navlink',
    },
    {
        nameId: 'account',
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

    const translationsMap = {
        wallet: t('link.wallet'),
        staking: t('link.staking'),
        explore: t('link.explore'),
        account: t('link.account'),
    };

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
                    index: number
                ) => (
                    <StyledNavItem key={index}>
                        <NavLink
                            to={route}
                            onClick={() => Mixpanel.track(trackMsg)}
                            data-test-id={testId}
                            className={`link ${brokenDisplay ? 'brokenDisplay' : ''}`}
                            exact={exact}
                        >
                            {icon}
                            <span className="name">{translationsMap[nameId]}</span>
                        </NavLink>
                    </StyledNavItem>
                )
            )}
        </StyledLinks>
    );
};

export default NavLinks;
