import React, { FC, useState, useCallback, KeyboardEvent, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useListener } from '../../hooks/eventListeners';
import AccountMenu from '../../shared/ui/core/AccountMenu';
import UserAccount from '../../shared/ui/core/UserAccount';
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
import Logo from './ui/Logo';
import NavLinks from './ui/NavLinks';
import SettingsItem from './ui/SettingsItem';

const isMobileVersion = isMobile();
const isDesktopVersion = !isMobileVersion;
const ESC_BUTTON_KEY = 'Escape'

type NavigationProps = {
    currentAccount: {
        accountId: string;
        accountsBalance: any;
        localStorage: {
            accountFound: boolean;
            accountId?: string;
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
        (accountId) => {
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
            <StyledTop>
                <Logo
                    mode={isMobileVersion ? 'mobile' : undefined}
                    isLink={!flowLimitationMainMenu}
                />
                {localStorage?.accountFound && (
                    <>
                        <StyledUserAccount>
                            <UserAccount
                                accountId={accountId || localStorage?.accountId}
                                onClick={handleAccountClick}
                                withIcon={isDesktopVersion}
                                flowLimitationSubMenu={flowLimitationSubMenu}
                            />
                        </StyledUserAccount>
                        {isMobileVersion && (
                            <UserIcon onClick={toggleNavigation} background />
                        )}
                    </>
                )}
            </StyledTop>

            <StyledNavigation hidden={!isContentVisible}>
                <NavLinks />
                <StyledFooter showDivider={isDesktopVersion}>
                    <SettingsItem icon={<HelpIcon />} trackMsg="Click Help button on nav">
                        <StyledLink
                            href="https://support.mynearwallet.com/en"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {t('support.link')}
                        </StyledLink>
                    </SettingsItem>
                    <StyledLangSelector>
                        <LangSwitcher />
                    </StyledLangSelector>
                    <AccountMenu
                        isVisible={localStorage?.accountFound && isAccountMenuVisible}
                        handleSelectAccount={handleSelectAccount}
                        activeAccountId={localStorage?.accountId}
                        accountsBalance={accountsBalance}
                        setIsAccountMenuVisible={setIsAccountMenuVisible}
                    />
                </StyledFooter>
            </StyledNavigation>
        </StyledHeader>
    );
};

export default Navigation;
