import React, { FC, useCallback, useRef } from 'react';
import { Translate } from 'react-localize-redux';
import { useDispatch, useSelector } from 'react-redux';

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
    show: boolean;
    handleSelectAccount: (accoundId: string) => void;
    accountIdLocalStorage?: string;
    accountsBalance: string[];
    setIsAccountMenuVisible: (state: boolean) => void;
};

const AccountMenu: FC<AccountMenuProps> = ({
    show,
    handleSelectAccount,
    accountIdLocalStorage,
    accountsBalance,
    setIsAccountMenuVisible,
}) => {
    const dispatch = useDispatch();
    const availableAccounts = useSelector(selectAvailableAccounts);

    const refreshBalance = useCallback((accountId) => {
        dispatch(getAccountBalance(accountId));
    }, []);

    const menuRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback(() => setIsAccountMenuVisible(false), []);

    useOnClickOutside(menuRef, handleClickOutside);

    if (show) {
        return (
            <StyledMenu id="accountMenu" ref={isMobileDevice ? null : menuRef} className="accountMenu">
                <h5>
                    <Translate id="link.switchAccount" />
                </h5>
                <AccountSelector
                    signedInAccountId={accountIdLocalStorage}
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
