import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import FormButton from '../common/FormButton';
import LoadingDots from '../common/loader/LoadingDots';
import Container from '../common/styled/Container.css';
import AccountExportAccountList from './AccountExportAccountList';
import { loadExportableAccounts, MAX_EXPORTABLE_ACCOUNTS } from './accountExportAccounts';

const AccountExportPage = styled(Container)`
    &&& {
        h1,
        h2 {
            text-align: center !important;
        }

        .buttons-bottom-buttons {
            margin-top: 38px;

            > button {
                display: block;
                width: 100%;
            }

            .link {
                display: block;
                margin: 20px auto;
            }
        }

        @media (max-width: 500px) {
            .buttons-bottom {
                display: flex;
                flex-direction: column;
                min-height: calc(100vh - 160px);
            }

            .buttons-bottom-buttons {
                margin-top: auto;
            }
        }
    }
`;

const LoadingState = styled.div`
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 180px;

    p {
        color: #72727a;
        margin: 12px 0 0;
    }
`;

const ErrorMessage = styled.p`
    color: #dc1f25;
    margin: 16px 0 0;
    text-align: center;
`;

const getInitiallySelectedAccountIds = (accounts) =>
    accounts
        .filter(({ availability }) => availability === 'available')
        .slice(0, MAX_EXPORTABLE_ACCOUNTS)
        .map(({ accountId }) => accountId);

export default function AccountExportSelect() {
    const history = useHistory();
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountIds, setSelectedAccountIds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadAccounts = async () => {
            try {
                const loadedAccounts = await loadExportableAccounts();

                if (!isMounted) {
                    return;
                }

                setAccounts(loadedAccounts);
                setSelectedAccountIds(getInitiallySelectedAccountIds(loadedAccounts));
            } catch {
                if (isMounted) {
                    setErrorMessage('Could not check your account access keys.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadAccounts();

        return () => {
            isMounted = false;
        };
    }, []);

    const availableAccounts = accounts.filter(
        ({ availability }) => availability === 'available'
    );
    const unavailableAccounts = accounts.filter(
        ({ availability }) => availability !== 'available'
    );

    const handleAccountSelection = (accountId) => {
        setSelectedAccountIds((currentSelectedAccountIds) => {
            if (currentSelectedAccountIds.includes(accountId)) {
                return currentSelectedAccountIds.filter((id) => id !== accountId);
            }

            if (currentSelectedAccountIds.length >= MAX_EXPORTABLE_ACCOUNTS) {
                return currentSelectedAccountIds;
            }

            return [...currentSelectedAccountIds, accountId];
        });
    };

    return (
        <AccountExportPage className='small-centered'>
            <div className='buttons-bottom'>
                <div className='send-theme'>
                    <h1>Export Accounts</h1>
                    <h2>Review the accounts that will be securely exported.</h2>
                    {isLoading ? (
                        <LoadingState>
                            <LoadingDots />
                            <p>Checking your accounts…</p>
                        </LoadingState>
                    ) : errorMessage ? null : (
                        <AccountExportAccountList
                            availableAccounts={availableAccounts}
                            unavailableAccounts={unavailableAccounts}
                            selectedAccountIds={selectedAccountIds}
                            onAccountSelection={handleAccountSelection}
                        />
                    )}
                    {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
                </div>
                <div className='buttons-bottom-buttons'>
                    <FormButton disabled>Export Selected Accounts</FormButton>
                    <FormButton
                        className='link'
                        color='gray'
                        onClick={() => history.push('/')}
                    >
                        Cancel
                    </FormButton>
                </div>
            </div>
        </AccountExportPage>
    );
}
