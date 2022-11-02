import React, { FC, useCallback, useRef } from 'react';
import { Translate } from 'react-localize-redux';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import useOnClickOutside from '../../../../hooks/useOnClickOutside';
import { getAccountBalance } from '../../../../redux/actions/account';
import { selectAvailableAccounts } from '../../../../redux/slices/availableAccounts';
import { VIEWPORT } from '../../../../shared/ui/mixins/viewport';
import isMobile from '../../../../utils/isMobile';
import AccountSelector from '../../../accounts/account_selector/AccountSelector';
import AccessAccountBtn from './AccessAccountBtn';
import CreateAccountBtn from './CreateAccountBtn';

const isMobileDevice = isMobile();

const StyledMenu = styled.div`
    position: fixed;
    top: 70px;
    right: 2.7%;
    border-radius: 8px;
    background-color: var(--mnw-component-background-1);
    color: #4a4f54;
    width: 320px;
    box-shadow: 0px 45px 56px rgba(0, 0, 0, 0.07),
        0px 10.0513px 12.5083px rgba(0, 0, 0, 0.0417275),
        0px 2.99255px 3.72406px rgba(0, 0, 0, 0.0282725);
    padding: 16px;

    .user-links {
        padding: 20px;
    }

    .account-selector {
        padding: 0.375rem 0 0;
        box-shadow: none;
    }

    button {
        width: 100% !important;
    }

    @media ${VIEWPORT.TABLET} {
        position: static;
        box-shadow: none;
        width: 100%;
    }
`;

type AccountMenuProps = {
    show: boolean;
    handleSelectAccount: (accoundId: string) => void;
    accountIdLocalStorage: string;
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

    const menuRef = useRef(null);

    const handleClickOutside = useCallback(() => setIsAccountMenuVisible(false), []);

    useOnClickOutside(menuRef, handleClickOutside);

    if (show) {
        return (
            <StyledMenu id="accountMenu" ref={isMobileDevice ? null : menuRef}>
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
