import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import FormButton from '../common/FormButton';
import LoadingSpinner from '../common/loader/LoadingSpinner';
import Container from '../common/styled/Container.css';
import ExportAccountSelectedIcon from '../svg/ExportAccountSelectedIcon';
import ExportAccountUnavailableIcon from '../svg/ExportAccountUnavailableIcon';

const ActivationPage = styled(Container)`
    max-width: 500px;

    &&& {
        h1,
        h2 {
            text-align: center !important;
        }
    }
`;

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
    background: #f0f0f1;
    border-radius: 8px;
    padding: 15px;

    & + & {
        margin-top: 8px;
    }

    .account-id {
        font-size: 16px;
        font-weight: 600;
        line-height: 20px;
        overflow-wrap: anywhere;
        word-break: break-word;
    }
`;

const StatusLine = styled.div`
    align-items: center;
    color: #72727a;
    display: flex;
    font-size: 12px;
    gap: 5px;
    line-height: 20px;
    margin-top: 6px;

    &.failed {
        color: #dc1f25;
    }

    &.pending {
        color: #0072ce;
    }

    &.confirmed {
        color: #5ace84;
    }
`;

const StatusIconSlot = styled.span`
    align-items: center;
    display: inline-flex;
    flex: 0 0 20px;
    height: 20px;
    justify-content: center;
    width: 20px;

    svg {
        height: 20px;
        width: 20px;
    }
`;

const RetryButton = styled(FormButton)`
    &&& {
        font-size: 12px;
        height: 26px;
        margin: 0 0 0 auto;
        min-width: 58px;
        padding: 0 10px;
        width: auto;
    }
`;

const activationStatusCopy = {
    awaiting_signature: 'Awaiting signature',
    submitted: 'Submitted',
    confirmed: 'Confirmed',
    failed: 'Failed',
};

const mockActivationRows = [
    { accountId: 'meteor-alice.testnet', status: 'awaiting_signature' },
    { accountId: 'meteor-bob.testnet', status: 'submitted' },
    { accountId: 'meteor-carol.testnet', status: 'confirmed' },
    { accountId: 'meteor-dan.testnet', status: 'failed' },
];
const MOCK_STATUS_DELAY_MS = 1500;

const statusIcon = (status) => {
    if (status === 'confirmed') {
        return <ExportAccountSelectedIcon />;
    }
    if (status === 'failed') {
        return <ExportAccountUnavailableIcon />;
    }
    return <LoadingSpinner size={20} />;
};

export default function AccountExportNewKeyActivation() {
    const history = useHistory();
    const location = useLocation();
    const accountIds = location.state?.accountIds;
    const [activationStates, setActivationStates] = useState(() =>
        Object.fromEntries(
            mockActivationRows.map(({ accountId, status }) => [
                accountId,
                status,
            ])
        )
    );

    useEffect(() => {
        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            history.replace('/export-accounts/select');
        }
    }, [accountIds, history]);

    useEffect(() => {
        const activatedAccountIds = mockActivationRows
            .filter(({ accountId }) => activationStates[accountId] === 'confirmed')
            .map(({ accountId }) => accountId);
        if (activatedAccountIds.length === mockActivationRows.length) {
            history.replace('/export-accounts/new-key-activated', {
                accountIds: activatedAccountIds,
            });
        }
    }, [activationStates, history]);

    useEffect(() => {
        const timers = Object.entries(activationStates).flatMap(([accountId, status]) => {
            if (status === 'awaiting_signature') {
                return window.setTimeout(() => {
                    setActivationStates((current) => ({
                        ...current,
                        [accountId]: 'submitted',
                    }));
                }, MOCK_STATUS_DELAY_MS);
            }
            if (status === 'submitted') {
                return window.setTimeout(() => {
                    setActivationStates((current) => ({
                        ...current,
                        [accountId]: 'confirmed',
                    }));
                }, MOCK_STATUS_DELAY_MS);
            }
            return [];
        });

        return () => timers.forEach((timer) => window.clearTimeout(timer));
    }, [activationStates]);

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return null;
    }

    const retryActivation = (accountId) => {
        setActivationStates((current) => ({
            ...current,
            [accountId]: 'awaiting_signature',
        }));
    };

    return (
        <ActivationPage className='small-centered'>
            <div className='send-theme'>
                <h1>Activating Meteor Keys</h1>
                <h2>
                    The new Meteor keys are being added to your selected accounts.
                </h2>
                <AccountSection>
                    <AccountSectionTitle>Account Status</AccountSectionTitle>
                    {mockActivationRows.map(({ accountId, status: initialStatus }) => {
                        const status = activationStates[accountId] || initialStatus;
                        return (
                            <AccountRow key={accountId}>
                                <div className='account-id'>{accountId}</div>
                                <StatusLine
                                    className={
                                        status === 'failed'
                                            ? 'failed'
                                            : status === 'confirmed'
                                                ? 'confirmed'
                                                : 'pending'
                                    }
                                >
                                    <StatusIconSlot>{statusIcon(status)}</StatusIconSlot>
                                    <span>{activationStatusCopy[status]}</span>
                                    {status === 'failed' && (
                                        <RetryButton
                                            className='small'
                                            color='blue'
                                            onClick={() => retryActivation(accountId)}
                                        >
                                            Retry
                                        </RetryButton>
                                    )}
                                </StatusLine>
                            </AccountRow>
                        );
                    })}
                </AccountSection>
            </div>
        </ActivationPage>
    );
}
