import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { switchAccount } from '../../redux/actions/account';
import { resolveMeteorWalletWebUrl } from '../../services/meteorConnectEnvironment';
import { newKeyTransferEligibilityKey } from '../../services/newKeyTransferState';
import { trackSunsetIneligibleGuidanceClicked } from '../sunset/sunsetAnalytics';
import ExportAccountSelectedIcon from '../svg/ExportAccountSelectedIcon';
import ExportAccountUnavailableIcon from '../svg/ExportAccountUnavailableIcon';
import { MAX_EXPORTABLE_ACCOUNTS } from './accountExportAccounts';

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

    .guidance {
        color: #72727a;
        font-size: 13px;
        line-height: 19px;
        margin: 8px 0 0;
    }

    .guidance-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 16px;
        margin-top: 8px;
    }

    .guidance-action {
        background: none;
        border: 0;
        color: #0072ce;
        cursor: pointer;
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        line-height: 19px;
        padding: 0;

        &:hover {
            color: #0063b4;
            text-decoration: underline;
        }

        &:disabled {
            color: #a5a5ab;
            cursor: wait;
            text-decoration: none;
        }
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

const getUnavailableAccountMessage = (availability, t) =>
    t(newKeyTransferEligibilityKey(availability));

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

/**
 * The next step for each reason an account cannot use the Meteor transfer, so no account is left
 * with only a refusal.
 */
const GUIDANCE = {
    two_factor_unsupported: {
        body: 'sunset.guidance.twoFactor',
        actions: ['turn_off_2fa', 'export_key'],
    },
    ledger_unsupported: { body: 'sunset.guidance.ledger', actions: ['open_meteor'] },
    not_funded: { body: 'sunset.guidance.notFunded', actions: ['export_key'] },
    no_local_key: { body: 'sunset.guidance.noLocalKey', actions: [] },
    not_full_access: { body: 'sunset.guidance.notFullAccess', actions: ['export_key'] },
    algorithm_unsupported: {
        body: 'sunset.guidance.algorithmUnsupported',
        actions: ['export_key'],
    },
    verification_failed: { body: null, actions: ['retry'] },
};

const ACTION_LABEL_KEYS = {
    turn_off_2fa: 'sunset.guidance.actions.turnOff2fa',
    export_key: 'sunset.guidance.actions.exportKey',
    open_meteor: 'sunset.guidance.actions.openMeteor',
    retry: 'sunset.common.retry',
};

const UnavailableAccountRow = ({ accountId, availability, isRetrying, onRetry, t }) => {
    const dispatch = useDispatch();
    const history = useHistory();
    const guidance = GUIDANCE[availability] || GUIDANCE.not_full_access;

    const runAction = (action) => {
        trackSunsetIneligibleGuidanceClicked({ availability, action });
        if (action === 'turn_off_2fa') {
            // 2FA is managed on the profile of the active account.
            dispatch(switchAccount({ accountId }));
            history.push('/profile');
        } else if (action === 'export_key') {
            history.push('/export-accounts/manual', {
                accountIds: [accountId],
                availabilityById: { [accountId]: availability },
            });
        } else if (action === 'open_meteor') {
            window.open(
                resolveMeteorWalletWebUrl(window.location.hostname),
                '_blank',
                'noopener,noreferrer'
            );
        } else if (action === 'retry') {
            onRetry?.(accountId);
        }
    };

    return (
        <AccountRow>
            <div className='account-details'>
                <div className='account-id'>{accountId}</div>
                <div className='status'>
                    <ExportAccountUnavailableIcon className='unavailable-icon' />
                    {getUnavailableAccountMessage(availability, t)}
                </div>
                {guidance.body && <p className='guidance'>{t(guidance.body)}</p>}
                {guidance.actions.length > 0 && (
                    <div className='guidance-actions'>
                        {guidance.actions
                            .filter((action) => action !== 'retry' || onRetry)
                            .map((action) => (
                                <button
                                    key={action}
                                    type='button'
                                    className='guidance-action'
                                    disabled={action === 'retry' && isRetrying}
                                    onClick={() => runAction(action)}
                                >
                                    {t(ACTION_LABEL_KEYS[action])}
                                </button>
                            ))}
                    </div>
                )}
            </div>
        </AccountRow>
    );
};

export default function AccountExportAccountList({
    availableAccounts,
    unavailableAccounts,
    selectedAccountIds,
    onAccountSelection,
    onRetryAccount,
    retryingAccountIds = [],
}) {
    const { t } = useTranslation();
    return (
        <>
            <AccountSection>
                <AccountSectionTitle>
                    {t('accountExport.list.selectPrompt', {
                        max: MAX_EXPORTABLE_ACCOUNTS,
                    })}
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
                    <EmptyState>{t('accountExport.list.empty')}</EmptyState>
                )}
            </AccountSection>
            {unavailableAccounts.length > 0 && (
                <AccountSection>
                    <AccountSectionTitle>
                        {t('accountExport.list.unavailableTitle')}
                    </AccountSectionTitle>
                    {unavailableAccounts.map(({ accountId, availability }) => (
                        <UnavailableAccountRow
                            key={accountId}
                            accountId={accountId}
                            availability={availability}
                            isRetrying={retryingAccountIds.includes(accountId)}
                            onRetry={onRetryAccount}
                            t={t}
                        />
                    ))}
                </AccountSection>
            )}
        </>
    );
}
