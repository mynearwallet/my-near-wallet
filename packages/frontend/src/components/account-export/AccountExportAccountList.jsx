import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ExportAccountSelectedIcon from '../svg/ExportAccountSelectedIcon';
import ExportAccountUnavailableIcon from '../svg/ExportAccountUnavailableIcon';

const AccountSection = styled.section`
    background: #fafafa;
    border-radius: 8px;
    margin-top: 10px;
    padding: 15px;
`;

const AccountSectionTitle = styled.p`
    color: #72727a;
    font-size: 14px;
    line-height: 20px;
    margin: 0 0 10px;
`;

const AccountRow = styled.div`
    align-items: center;
    background: #f0f0f1;
    border: 0;
    border-radius: 8px;
    color: #000;
    display: flex;
    min-height: 54px;
    padding: 15px;
    text-align: left;
    width: 100%;

    & + & {
        margin-top: 8px;
    }

    &.is-selectable {
        cursor: pointer;

        &:hover {
            background: #e9e9ec;
        }
    }

    .account-details {
        flex: 1;
        min-width: 0;
    }

    .account-id {
        font-size: 16px;
        font-weight: 600;
        line-height: 20px;
        overflow-wrap: anywhere;
        word-break: break-word;
    }

    .status {
        align-items: center;
        color: #dc1f25;
        display: flex;
        font-size: 12px;
        gap: 5px;
        line-height: 16px;
        margin-top: 6px;
    }

    .unavailable-icon {
        height: 14px;
        min-width: 14px;
        width: 14px;
    }

    .selection-indicator,
    .check-empty {
        flex: 0 0 20px;
        height: 20px;
        margin-left: 20px;
        width: 20px;
    }

    .check-empty {
        background: #d9d9dc;
        border-radius: 50%;
    }
`;

const EmptyState = styled.p`
    color: #72727a;
    font-size: 14px;
    line-height: 20px;
    margin: 0;
`;

const getUnavailableAccountMessage = (availability, t) => {
    switch (availability) {
        case 'verification_failed':
            return t('newKeyTransfer.eligibility.verificationFailed');
        case 'two_factor_unsupported':
            return t('newKeyTransfer.eligibility.twoFactorUnsupported');
        case 'ledger_unsupported':
            return t('newKeyTransfer.eligibility.ledgerUnsupported');
        case 'algorithm_unsupported':
            return t('newKeyTransfer.eligibility.algorithmUnsupported');
        case 'no_local_key':
            return t('newKeyTransfer.eligibility.noLocalKey');
        default:
            return t('newKeyTransfer.eligibility.notFullAccess');
    }
};

const SelectableAccountRow = ({ accountId, isSelected, onSelect }) => (
    <AccountRow
        as='button'
        type='button'
        className='is-selectable'
        aria-pressed={isSelected}
        onClick={() => onSelect(accountId)}
    >
        <span className='account-details'>
            <span className='account-id'>{accountId}</span>
        </span>
        {isSelected ? (
            <ExportAccountSelectedIcon className='selection-indicator' />
        ) : (
            <span className='check-empty' aria-hidden='true' />
        )}
    </AccountRow>
);

const UnavailableAccountRow = ({ accountId, availability, t }) => (
    <AccountRow>
        <div className='account-details'>
            <div className='account-id'>{accountId}</div>
            <div className='status'>
                <ExportAccountUnavailableIcon className='unavailable-icon' />
                {getUnavailableAccountMessage(availability, t)}
            </div>
        </div>
    </AccountRow>
);

export default function AccountExportAccountList({
    availableAccounts,
    unavailableAccounts,
    selectedAccountIds,
    onAccountSelection,
}) {
    const { t } = useTranslation();
    return (
        <>
            <AccountSection>
                <AccountSectionTitle>
                    Select one or more accounts to export ( Max 30 )
                </AccountSectionTitle>
                {availableAccounts.length > 0 ? (
                    availableAccounts.map(({ accountId }) => (
                        <SelectableAccountRow
                            key={accountId}
                            accountId={accountId}
                            isSelected={selectedAccountIds.includes(accountId)}
                            onSelect={onAccountSelection}
                        />
                    ))
                ) : (
                    <EmptyState>No accounts are available for export.</EmptyState>
                )}
            </AccountSection>
            {unavailableAccounts.length > 0 && (
                <AccountSection>
                    <AccountSectionTitle>
                        The following accounts are not available
                    </AccountSectionTitle>
                    {unavailableAccounts.map(({ accountId, availability }) => (
                        <UnavailableAccountRow
                            key={accountId}
                            accountId={accountId}
                            availability={availability}
                            t={t}
                        />
                    ))}
                </AccountSection>
            )}
        </>
    );
}
