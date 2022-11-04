import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';

import LangSwitcher from '../../../../components/common/LangSwitcher';
import HelpIcon from '../../../../components/svg/HelpIcon';
import UserIcon from '../../../../components/svg/UserIcon';
import AccountMenu from '../../../../shared/ui/core/AccountMenu';
import Logo from '../../../../shared/ui/core/Logo';
import UserAccount from '../../../../shared/ui/core/UserAccount';
import isMobile from '../../../../utils/isMobile';
import NavLinks from '../NavLinks';
import SettingsItem from '../SettingsItem';
import {
    StyledTop,
    StyledUserAccount,
    StyledNavigation,
    StyledFooter,
    StyledLangSelector,
    StyledLink,
} from './ui';

const isMobileVersion = isMobile();
const isDesktopVersion = !isMobileVersion;

type NavigationProps = {
    currentAccount: {
        accountId: string;
        accountsBalance: any;
        localStorage: {
            accountFound: boolean;
            accountId?: string;
        };
    };
    flowLimitationMainMenu: boolean;
    flowLimitationSubMenu: boolean;
    isContentVisible: boolean;
    isAccountMenuVisible: boolean;
    setIsAccountMenuVisible: (state: boolean) => void;
    toggleNavigation: VoidFunction;
    handleAccountClick: VoidFunction;
    handleSelectAccount: (accountId: string) => void;
};

const Navigation: FC<NavigationProps> = ({
    currentAccount,
    flowLimitationMainMenu,
    flowLimitationSubMenu,
    isContentVisible,
    isAccountMenuVisible,
    setIsAccountMenuVisible,
    toggleNavigation,
    handleAccountClick,
    handleSelectAccount,
}) => {
    const { t } = useTranslation();
    const { accountId, accountsBalance, localStorage } = currentAccount;

    return (
        <>
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
        </>
    );
};

export default Navigation;
