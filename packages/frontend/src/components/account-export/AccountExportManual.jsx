import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ClickToCopy from '../common/ClickToCopy';
import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';
import CopyIcon from '../svg/CopyIcon';
import { loadExportAccountSecrets } from './accountExportAccounts';
import { createPrivateKeyMask } from './accountExportManual.utils';

const ManualExportPage = styled(Container)`
    max-width: 500px;

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
    }
`;

const Warning = styled.p`
    color: #dc1f25;
    margin: 24px 0 0;
    text-align: center;
`;

const AccountList = styled.div`
    margin-top: 56px;
`;

const AccountCard = styled.section`
    background: #fafafa;
    border-radius: 8px;
    padding: 16px;

    & + & {
        margin-top: 12px;
    }
`;

const Credential = styled.div`
    & + & {
        margin-top: 16px;
    }
`;

const CredentialHeader = styled.div`
    align-items: center;
    display: flex;
    justify-content: space-between;
    min-height: 20px;
`;

const CredentialLabel = styled.span`
    color: #72727a;
    font-size: 14px;
    line-height: 20px;
`;

const CopyControl = styled(ClickToCopy)`
    align-items: center;
    color: #0072ce;
    display: flex;
    font-size: 12px;
    line-height: 16px;

    svg {
        height: 14px;
        margin-right: 4px;
        width: 14px;
    }

    svg path {
        stroke: #0072ce;
    }
`;

const UnavailableCopy = styled.span`
    color: #a5a5ab;
    font-size: 12px;
    line-height: 16px;
`;

const CredentialValue = styled.button`
    align-items: center;
    background: #f0f0f1;
    border: 0;
    border-radius: 8px;
    color: #000;
    cursor: ${({ $canToggle }) => ($canToggle ? 'pointer' : 'default')};
    display: flex;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    margin-top: 8px;
    min-height: 54px;
    overflow-wrap: anywhere;
    padding: 15px;
    position: relative;
    text-align: left;
    user-select: ${({ $isHidden }) => ($isHidden ? 'none' : 'text')};
    width: 100%;
    word-break: break-all;
`;

const CredentialText = styled.span`
    filter: ${({ $isHidden }) => ($isHidden ? 'blur(6px)' : 'none')};
`;

const RevealOverlay = styled.span`
    align-items: center;
    color: #24272a;
    display: flex;
    flex-direction: column;
    font-size: 12px;
    font-weight: 500;
    justify-content: center;
    left: 0;
    line-height: 16px;
    pointer-events: none;
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);

    svg {
        height: 24px;
        margin-bottom: 2px;
        width: 24px;
    }
`;

const ErrorMessage = styled.p`
    color: #dc1f25;
    margin: 20px 0 0;
    text-align: center;
`;

const HIDDEN_VALUE = '••••••••••••••••••••••••••••••••';

const CredentialRow = ({
    label,
    value,
    copyValue = value,
    isHidden = false,
    isLoading = false,
    isCopyable = true,
    onToggle,
}) => {
    const canCopy = isCopyable && Boolean(copyValue) && !isLoading;
    const displayValue = isLoading ? 'Loading credentials…' : value;

    return (
        <Credential>
            <CredentialHeader>
                <CredentialLabel>{label}</CredentialLabel>
                {canCopy ? (
                    <CopyControl copy={copyValue}>
                        <CopyIcon />
                        Copy
                    </CopyControl>
                ) : (
                    <UnavailableCopy>Copy</UnavailableCopy>
                )}
            </CredentialHeader>
            <CredentialValue
                $canToggle={Boolean(onToggle)}
                $isHidden={isHidden}
                onClick={onToggle}
                type='button'
            >
                <CredentialText $isHidden={isHidden}>{displayValue}</CredentialText>
                {isHidden && !isLoading && (
                    <RevealOverlay>
                        <svg
                            aria-hidden='true'
                            fill='none'
                            viewBox='0 0 24 24'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M3 3 21 21M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.7 10.7 0 0 1 12 4c6.4 0 10 8 10 8a18.5 18.5 0 0 1-3.1 4.3M6.1 6.1C3.6 8.1 2 12 2 12s3.6 8 10 8c1 0 2-.2 2.9-.6'
                                stroke='currentColor'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                            />
                        </svg>
                        Reveal
                    </RevealOverlay>
                )}
            </CredentialValue>
        </Credential>
    );
};

export default function AccountExportManual({ history, location }) {
    const { t } = useTranslation();
    const accountIds = location.state?.accountIds;
    const [credentialsByAccountId, setCredentialsByAccountId] = useState({});
    const [revealedCredentials, setRevealedCredentials] = useState({});
    const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            history.replace('/export-accounts/select');
        }
    }, [accountIds, history]);

    useEffect(() => {
        let isMounted = true;

        const loadCredentials = async () => {
            try {
                const credentials = await loadExportAccountSecrets(accountIds);

                if (isMounted) {
                    setCredentialsByAccountId(
                        credentials.reduce(
                            (credentialsById, accountCredentials) => ({
                                ...credentialsById,
                                [accountCredentials.accountId]: {
                                    ...accountCredentials,
                                    privateKeyMask: createPrivateKeyMask(
                                        accountCredentials.privateKey
                                    ),
                                },
                            }),
                            {}
                        )
                    );
                }
            } catch (error) {
                if (isMounted) {
                    setErrorMessage(
                        error instanceof Error
                            ? error.message
                            : t('accountExport.manual.credentialsFailed')
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoadingCredentials(false);
                }
            }
        };

        if (Array.isArray(accountIds) && accountIds.length > 0) {
            void loadCredentials();
        }

        return () => {
            isMounted = false;
        };
    }, [accountIds]);

    const toggleCredential = (accountId, credentialName) => {
        const isRevealed = revealedCredentials[accountId]?.[credentialName];

        if (isRevealed) {
            setRevealedCredentials((currentCredentials) => ({
                ...currentCredentials,
                [accountId]: {
                    ...currentCredentials[accountId],
                    [credentialName]: false,
                },
            }));
            return;
        }

        const credentials = credentialsByAccountId[accountId];
        if (!credentials || !credentials[credentialName]) {
            return;
        }

        setRevealedCredentials((currentCredentials) => ({
            ...currentCredentials,
            [accountId]: {
                ...currentCredentials[accountId],
                [credentialName]: true,
            },
        }));
    };

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return null;
    }

    return (
        <ManualExportPage className='small-centered'>
            <div className='buttons-bottom'>
                <div className='send-theme'>
                    <h1>{t('accountExport.manual.title')}</h1>
                    <h2>{t('accountExport.manual.subtitle')}</h2>
                    <Warning>{t('accountExport.manual.warning')}</Warning>
                    {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
                    <AccountList>
                        {accountIds.map((accountId, index) => {
                            const credentials = credentialsByAccountId[accountId];
                            const isPrivateKeyRevealed =
                                revealedCredentials[accountId]?.privateKey;

                            return (
                                <AccountCard key={accountId}>
                                    <CredentialRow
                                        label={t('accountExport.manual.accountLabel', {
                                            index: index + 1,
                                        })}
                                        value={accountId}
                                    />
                                    <CredentialRow
                                        copyValue={credentials?.privateKey}
                                        isHidden={
                                            Boolean(credentials) && !isPrivateKeyRevealed
                                        }
                                        isCopyable={Boolean(credentials?.privateKey)}
                                        isLoading={isLoadingCredentials}
                                        label={t('accountExport.manual.privateKeyLabel')}
                                        onToggle={() =>
                                            void toggleCredential(accountId, 'privateKey')
                                        }
                                        value={
                                            isPrivateKeyRevealed
                                                ? credentials?.privateKey || HIDDEN_VALUE
                                                : credentials?.privateKeyMask ||
                                                  HIDDEN_VALUE
                                        }
                                    />
                                </AccountCard>
                            );
                        })}
                    </AccountList>
                </div>
                <div className='buttons-bottom-buttons'>
                    <FormButton onClick={() => history.push('/')}>
                        {t('accountExport.manual.backToWallet')}
                    </FormButton>
                    <FormButton
                        className='link'
                        color='gray'
                        onClick={() => history.goBack()}
                    >
                        {t('accountExport.manual.back')}
                    </FormButton>
                </div>
            </div>
        </ManualExportPage>
    );
}
