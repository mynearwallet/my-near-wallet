import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { isSunsetCapabilityEnabled } from '../../config/sunset';
import parseFundingOptions from '../../utils/parseFundingOptions';
import { KEY_ACTIVE_ACCOUNT_ID, wallet } from '../../utils/wallet';
import FormButton from '../common/FormButton';
import LoadingDots from '../common/loader/LoadingDots';
import Container from '../common/styled/Container.css';
import { initialGateStatus } from './existingAccountGateStatus';
import FeatureRetiredPage from './FeatureRetiredPage';

const CheckingContainer = styled(Container)`
    &&& {
        text-align: center;

        h1,
        h2 {
            text-align: center !important;
        }
    }

    .loading {
        margin-top: 60px;
    }

    > button {
        width: 100%;
    }
`;

const readFundingOptions = (search) => {
    try {
        return parseFundingOptions(search);
    } catch {
        // Unparseable funding options still mean a creation request.
        return {};
    }
};

const activeAccountId = () => {
    try {
        return wallet.accountId || localStorage.getItem(KEY_ACTIVE_ACCOUNT_ID);
    } catch {
        return wallet.accountId;
    }
};

/**
 * `/set-recovery`, `/setup-seed-phrase` and `/setup-ledger` serve both account creation and
 * security changes to an existing account. Once creation is retired this lets the existing-account
 * use through and shows the retired page for creation. It fails closed: if the chain cannot be
 * asked, the user gets a retry, never the creation flow.
 */
export default function ExistingAccountGate({
    accountId,
    fundingContract,
    route,
    children,
}) {
    const { t } = useTranslation();
    const location = useLocation();
    const creationRetired = !isSunsetCapabilityEnabled('createAccount');
    const isFundedCreation =
        !!fundingContract || readFundingOptions(location.search) != null;
    const isActiveAccount = !!accountId && accountId === activeAccountId();

    const [status, setStatus] = useState(() =>
        initialGateStatus({ creationRetired, isActiveAccount, isFundedCreation })
    );

    const check = useCallback(async () => {
        setStatus('checking');
        try {
            setStatus((await wallet.checkIsNew(accountId)) ? 'new' : 'existing');
        } catch {
            setStatus('error');
        }
    }, [accountId]);

    useEffect(() => {
        if (status === 'checking') {
            void check();
        }
        // Only the initial state decides whether a check is needed.
    }, []);

    if (status === 'existing') {
        return children;
    }

    if (status === 'new') {
        return <FeatureRetiredPage capability='createAccount' route={route} />;
    }

    return (
        <CheckingContainer className='small-centered border'>
            {status === 'checking' ? (
                <div className='loading' role='status'>
                    <LoadingDots />
                    <h2>{t('sunset.existingAccountGate.checking')}</h2>
                </div>
            ) : (
                <>
                    <h1>{t('sunset.existingAccountGate.errorTitle')}</h1>
                    <h2>{t('sunset.existingAccountGate.errorBody')}</h2>
                    <FormButton onClick={() => void check()}>
                        {t('sunset.common.retry')}
                    </FormButton>
                </>
            )}
        </CheckingContainer>
    );
}
