import React, { FC, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import isMobile from '../../utils/isMobile';
import LangSwitcher from '../common/LangSwitcher';
import HelpIcon from '../svg/HelpIcon';
import UserIcon from '../svg/UserIcon';
import {
    StyledHeader,
    StyledTop,
    StyledUserAccount,
    StyledNavigation,
    StyledFooter,
    StyledLangSelector,
    StyledLink,
} from './ui';
import AccountMenu from './ui/AccountMenu';
import Logo from './ui/Logo';
import NavLinks from './ui/NavLinks';
import SettingsItem from './ui/SettingsItem';
import UserAccount from './ui/UserAccount';

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

// @todo: rename to Header
const Navigation: FC<NavigationProps> = ({
    currentAccount,
    selectAccount,
    flowLimitationMainMenu,
    flowLimitationSubMenu,
}) => {
    const { t } = useTranslation();
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
                    <SettingsItem
                        icon={<HelpIcon />}
                        trackMsg="Click Help button on nav"
                    >
                        <StyledLink
                            href="https://support.mynearwallet.com/en"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {t('support')}
                        </StyledLink>
                    </SettingsItem>
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
