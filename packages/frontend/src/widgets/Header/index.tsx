import React, { FC, useState, useCallback, KeyboardEvent, MouseEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import isMobile from '../../utils/isMobile';
import { useListener } from '../../hooks/eventListeners';
import { switchAccount } from '../../redux/actions/account';
import { selectAccountSlice } from '../../redux/slices/account';
import {
    selectFlowLimitationMainMenu,
    selectFlowLimitationSubMenu,
} from '../../redux/slices/flowLimitation';
import { StyledHeader } from './ui';
import Navigation from './ui/Navigation';

const isMobileVersion = isMobile();
const isDesktopVersion = !isMobileVersion;
const ESC_BUTTON_KEY = 'Escape';

const Header: FC = () => {
    const dispatch = useDispatch();
    const account = useSelector(selectAccountSlice);
    const flowLimitationMainMenu = useSelector(selectFlowLimitationMainMenu);
    const flowLimitationSubMenu = useSelector(selectFlowLimitationSubMenu);

    const selectAccount = useCallback((accountId) => {
        dispatch(switchAccount(accountId));
    }, []);

    const [isNavigationOpen, setIsNavigationOpen] = useState(isDesktopVersion);
    const [isAccountMenuVisible, setIsAccountMenuVisible] = useState(isMobileVersion);

    useListener('keydown', (event: KeyboardEvent) => {
        if (event.key === ESC_BUTTON_KEY) {
            if (isMobileVersion) {
                setIsNavigationOpen(false);
            } else {
                setIsAccountMenuVisible(false);
            }
        }
    });

    useListener('click', (event: MouseEvent) => {
        if (isMobileVersion) {
            // @todo find a better way how to close mobile menu
            const navigation = document.getElementById('nav-container');
            const element = event.target as HTMLElement;

            if (
                element.tagName === 'BUTTON' ||
                element.tagName === 'A' ||
                !navigation?.contains(element)
            ) {
                setIsNavigationOpen(false);
            }
        }
    });

    const toggleNavigation = () => {
        if (!flowLimitationSubMenu && isMobileVersion) {
            setIsNavigationOpen(!isNavigationOpen);
        }
    };

    const handleAccountClick = () => {
        if (isMobileVersion) {
            setIsNavigationOpen(!isNavigationOpen);
        } else {
            setIsAccountMenuVisible(!isAccountMenuVisible);
        }
    };

    const handleSelectAccount = useCallback(
        (accountId: string) => {
            selectAccount(accountId);

            if (isDesktopVersion) {
                setIsAccountMenuVisible(false);
            }
        },
        [isDesktopVersion]
    );

    const isContentVisible = isDesktopVersion || isNavigationOpen;

    return (
        <StyledHeader id="nav-container">
            <Navigation
                flowLimitationMainMenu={flowLimitationMainMenu}
                flowLimitationSubMenu={flowLimitationSubMenu}
                currentAccount={account}
                isContentVisible={isContentVisible}
                isAccountMenuVisible={isAccountMenuVisible}
                setIsAccountMenuVisible={setIsAccountMenuVisible}
                toggleNavigation={toggleNavigation}
                handleAccountClick={handleAccountClick}
                handleSelectAccount={handleSelectAccount}
            />
        </StyledHeader>
    );
};

export default Header;
