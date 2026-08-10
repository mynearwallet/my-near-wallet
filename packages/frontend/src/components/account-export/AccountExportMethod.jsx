import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import {
    meteorNetworkId,
    promptMeteorAccountTransfer,
} from '../../services/meteorConnect';
import Container from '../common/styled/Container.css';
import MeteorConnectIcon from '../svg/MeteorConnectIcon';
import exportManualIcon from '../svg/Vector.svg';
import { loadExportAccountSecrets } from './accountExportAccounts';
import { saveAccountExportSuccess } from './accountExportSuccessState';

const ExportMethodPage = styled(Container)`
    &.method-page {
        max-width: 900px;
    }

    &&& {
        h1,
        h2 {
            text-align: center !important;
        }
    }
`;

const MethodList = styled.div`
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: 56px;

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
    }
`;

const MethodButton = styled.button`
    align-items: center;
    border: 0;
    border-radius: 16px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 280px;
    padding: 32px;
    text-align: center;
    transition: transform 150ms, box-shadow 150ms;

    &:hover:not(:disabled) {
        box-shadow: 0 8px 20px rgb(36 39 42 / 15%);
        transform: translateY(-2px);
    }

    &:disabled {
        cursor: wait;
        opacity: 0.75;
    }

    .method-icon-slot {
        align-items: center;
        display: flex;
        height: 65px;
        justify-content: center;
        margin-bottom: 24px;
        width: 68px;
    }

    .method-icon {
        display: block;
        flex: none;
        object-fit: contain;
        overflow: visible;
    }

    .meteor-connect-icon {
        height: 65px;
        width: 68px;
    }

    .manual-export-icon {
        height: 65px;
        width: 68px;
    }

    .method-title {
        font-size: 20px;
        font-weight: 700;
        line-height: 26px;
    }

    .method-description {
        font-size: 14px;
        line-height: 21px;
        margin-top: 8px;
    }

    &.meteor-connect {
        background: #5380f5;
        color: #fff;
    }

    &.manual-export {
        background: #f0f4ff;
        color: #5380f5;

        .method-icon {
            color: #5380f5;
        }
    }
`;

const ErrorMessage = styled.p`
    color: #dc1f25;
    margin: 20px 0 0;
    text-align: center;
`;

export default function AccountExportMethod() {
    const history = useHistory();
    const location = useLocation();
    const accountIds = location.state?.accountIds;
    const [isExporting, setIsExporting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            history.replace('/export-accounts/select');
        }
    }, [accountIds, history]);

    const handleMeteorConnect = async () => {
        let didNavigateToSuccess = false;

        setIsExporting(true);
        setErrorMessage('');

        try {
            const accounts = await loadExportAccountSecrets(accountIds);
            const outcome = await promptMeteorAccountTransfer({
                accounts,
                networkId: meteorNetworkId,
            });

            if (outcome.status === 'imported') {
                didNavigateToSuccess = true;
                saveAccountExportSuccess(accountIds);
                history.push('/export-accounts/success', { accountIds });
            } else if (outcome.status === 'declined') {
                setErrorMessage('The account transfer was declined in Meteor Wallet.');
            } else if (outcome.status === 'expired') {
                setErrorMessage('The account transfer expired. You can try again.');
            }
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Could not start the account transfer.'
            );
        } finally {
            if (!didNavigateToSuccess) {
                setIsExporting(false);
            }
        }
    };

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return null;
    }

    return (
        <ExportMethodPage className='method-page'>
            <div className='send-theme'>
                <h1>How would you like to export?</h1>
                <h2>Choose how you want to access and export your accounts.</h2>
                <MethodList>
                    <MethodButton
                        className='meteor-connect'
                        disabled={isExporting}
                        onClick={() => void handleMeteorConnect()}
                    >
                        <span className='method-icon-slot'>
                            <MeteorConnectIcon className='method-icon meteor-connect-icon' />
                        </span>
                        <span className='method-title'>Meteor Connect</span>
                        <span className='method-description'>
                            Connect with Meteor to select and export your accounts
                            securely.
                        </span>
                    </MethodButton>
                    <MethodButton
                        className='manual-export'
                        disabled={isExporting}
                        onClick={() =>
                            history.push('/export-accounts/manual', { accountIds })
                        }
                    >
                        <span className='method-icon-slot'>
                            <img
                                alt=''
                                className='method-icon manual-export-icon'
                                src={exportManualIcon}
                            />
                        </span>
                        <span className='method-title'>Export Manually</span>
                        <span className='method-description'>
                            Reveal and copy your private keys.
                        </span>
                    </MethodButton>
                </MethodList>
                {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
            </div>
        </ExportMethodPage>
    );
}
