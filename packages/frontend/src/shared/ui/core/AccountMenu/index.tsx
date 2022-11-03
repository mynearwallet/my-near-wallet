import React, { FC, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import AccountSelector from '../../../../components/accounts/account_selector/AccountSelector';
import useOnClickOutside from '../../../../hooks/useOnClickOutside';
import { getAccountBalance } from '../../../../redux/actions/account';
import { selectAvailableAccounts } from '../../../../redux/slices/availableAccounts';
import isMobile from '../../../../utils/isMobile';
import AccessAccountBtn from './AccessAccountBtn';
import CreateAccountBtn from './CreateAccountBtn';
import { StyledMenu } from './ui';

const isMobileDevice = isMobile();

type AccountMenuProps = {
    isVisible: boolean;
    setIsAccountMenuVisible: (state: boolean) => void;
    activeAccountId?: string;
    handleSelectAccount: (accoundId: string) => void;
    accountsBalance: string[];
};

const AccountMenu: FC<AccountMenuProps> = ({
    isVisible,
    handleSelectAccount,
    activeAccountId,
    accountsBalance,
    setIsAccountMenuVisible,
}) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const availableAccounts = useSelector(selectAvailableAccounts);

    const refreshBalance = useCallback((accountId) => {
        dispatch(getAccountBalance(accountId));
    }, []);

    const menuRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback(() => setIsAccountMenuVisible(false), []);

    useOnClickOutside(menuRef, handleClickOutside);

    if (isVisible) {
        return (
            <StyledMenu
                id="accountMenu"
                ref={isMobileDevice ? null : menuRef}
                className="accountMenu"
            >
                <h5>{t('link.switchAccount')}</h5>
                <AccountSelector
                    signedInAccountId={activeAccountId}
                    availableAccounts={availableAccounts}
                    accountsBalances={accountsBalance}
                    getAccountBalance={refreshBalance}
                    onSelectAccount={handleSelectAccount}
                    showBalanceInUSD
                />
                <AccessAccountBtn />
                <CreateAccountBtn />
            </StyledMenu>
        );
    }

    return null;
};

export default AccountMenu;
