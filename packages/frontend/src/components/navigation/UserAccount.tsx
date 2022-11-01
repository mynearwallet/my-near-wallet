import React, { FC } from 'react';
import styled from 'styled-components';

import classNames from '../../utils/classNames';
import ChevronIcon from '../svg/ChevronIcon';
import UserIcon from '../svg/UserIcon';

const StyledUserAccount = styled.div`
    background-color: #f0f0f1;
    display: flex;
    align-items: center;
    border-radius: 40px;
    padding: 2px 5px 2px 2px;
    cursor: pointer;
    user-select: none;

    .user-icon {
        min-width: 36px;
        min-height: 36px;
        .background {
            fill: transparent;
        }
    }

    .account-wrapper {
        font-weight: 600;
        font-size: 14px;
        margin: 0 14px 0 9px;
        white-space: nowrap;
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #72727a;

        @media (max-width: 991px) {
            margin: 0 14px 0 12px;
        }
    }

    .icon-wrapper {
        background-color: #e5e5e6;
        min-width: 28px;
        min-height: 28px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transform: rotate(90deg);

        svg {
            width: 7px;
        }
    }

    &.no-click {
        pointer-events: none;

        .icon-wrapper {
            display: none;
        }
    }
`;

type UserAccountProps = {
    onClick: VoidFunction;
    accountId?: string;
    withIcon?: boolean;
    flowLimitationSubMenu?: boolean;
};

const UserAccount: FC<UserAccountProps> = ({
    onClick,
    accountId = '',
    withIcon = true,
    flowLimitationSubMenu = false,
}) => (
    <StyledUserAccount
        className={classNames(['user-account', { 'no-click': flowLimitationSubMenu }])}
        onClick={onClick}
    >
        {withIcon && <UserIcon />}
        <div className="account-wrapper" data-test-id="currentUser">
            {accountId}
        </div>
        <div className="icon-wrapper">
            <ChevronIcon />
        </div>
    </StyledUserAccount>
);

export default UserAccount;
