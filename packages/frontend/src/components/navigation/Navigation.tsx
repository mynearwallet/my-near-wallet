import React, { FC, useState, useCallback } from 'react';

import isMobile from '../../utils/isMobile';
import LangSwitcher from '../common/LangSwitcher';
import UserIcon from '../svg/UserIcon';
import AccountMenu from './AccountMenu';
import Logo from './Logo';
import NavLinks from './NavLinks';
import {
    StyledHeader,
    StyledTop,
    StyledUserAccount,
    StyledNavigation,
    StyledFooter,
    StyledLangSelector,
} from './ui';
import UserAccount from './UserAccount';

const isMobileDevice = isMobile();

type NavigationProps = {
    currentAccount: {
        accountId: string;
        accountsBalance: any;
        localStorage: {
            accountFound: boolean;
            accountId: string;
        };
    };
    selectAccount: (accountId: string) => void;
    flowLimitationMainMenu: boolean;
    flowLimitationSubMenu: boolean;
};

const Navigation: FC<NavigationProps> = ({
    currentAccount,
    selectAccount,
    flowLimitationMainMenu,
    flowLimitationSubMenu,
}) => {
    const { accountId, accountsBalance, localStorage } = currentAccount;
    const [isNavigationOpen, setIsNavigationOpen] = useState(!isMobileDevice);
    const [isAccountMenuVisible, setIsAccountMenuVisible] = useState(isMobileDevice);

    const toggleNavigation = () => {
        if (!flowLimitationSubMenu && isMobileDevice) {
            setIsNavigationOpen(!isNavigationOpen);
        }
    };

    const handleAccountClick = () => {
        if (isMobileDevice) {
            setIsNavigationOpen(!isNavigationOpen);
        } else {
            setIsAccountMenuVisible(!isAccountMenuVisible);
        }
    };

    const handleSelectAccount = useCallback((accountId) => {
        selectAccount(accountId);
        setIsAccountMenuVisible(false);
    }, []);

    const isContentVisible = !isMobileDevice || isNavigationOpen;

    return (
        <StyledHeader id="nav-container">
            <StyledTop>
                <Logo
                    mode={isMobileDevice ? 'mobile' : undefined}
                    link={!flowLimitationMainMenu}
                />
                {localStorage?.accountFound && (
                    <>
                        <StyledUserAccount>
                            <UserAccount
                                accountId={accountId || localStorage?.accountId}
                                onClick={handleAccountClick}
                                withIcon={!isMobileDevice}
                                flowLimitationSubMenu={flowLimitationSubMenu}
                            />
                        </StyledUserAccount>
                        {isMobileDevice && (
                            <UserIcon onClick={toggleNavigation} background />
                        )}
                    </>
                )}
            </StyledTop>

            <StyledNavigation hidden={!isContentVisible}>
                <NavLinks />
                <StyledFooter showDivider={!isMobileDevice}>
                    <StyledLangSelector>
                        <LangSwitcher />
                    </StyledLangSelector>
                    <AccountMenu
                        show={localStorage?.accountFound && isAccountMenuVisible}
                        handleSelectAccount={handleSelectAccount}
                        accountIdLocalStorage={localStorage?.accountId}
                        accountsBalance={accountsBalance}
                        setIsAccountMenuVisible={setIsAccountMenuVisible}
                    />
                </StyledFooter>
            </StyledNavigation>
        </StyledHeader>
    );
};

export default Navigation;
