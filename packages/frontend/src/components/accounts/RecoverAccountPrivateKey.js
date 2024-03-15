import { KeyPair } from 'near-api-js';
import { parse as parseQuery, stringify } from 'query-string';
import React, { useState } from 'react';
import { Translate } from 'react-localize-redux';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import styled from 'styled-components';

import { Mixpanel } from '../../mixpanel';
import {
    clearAccountState,
    recoverAccountSecretKey,
    redirectTo,
    redirectToApp,
    refreshAccount,
} from '../../redux/actions/account';
import {
    clearGlobalAlert,
    clearLocalAlert,
    showCustomAlert,
} from '../../redux/actions/status';
import { actions as importZeroBalanceAccountActions } from '../../redux/slices/importZeroBalanceAccount';
import { importZeroBalanceAccountPrivateKey } from '../../redux/slices/importZeroBalanceAccount/importAccountThunks';
import { selectStatusLocalAlert } from '../../redux/slices/status';
import classNames from '../../utils/classNames';
import parseFundingOptions from '../../utils/parseFundingOptions';
import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';

const { setZeroBalanceAccountImportMethod } = importZeroBalanceAccountActions;

const StyledContainer = styled(Container)`
    .input {
        width: 100%;
    }

    .input-sub-label {
        margin-bottom: 30px;
    }

    h4 {
        :first-of-type {
            margin: 30px 0 0 0 !important;
        }
    }

    button {
        width: 100% !important;
        margin-top: 30px !important;
    }
`;

const RecoverAccountPrivateKey = () => {
    const [privateKey, setPrivateKey] = useState('');
    const [recoveringAccount, setRecoveringAccount] = useState(false);
    const localAlert = useSelector(selectStatusLocalAlert);
    const location = useLocation();
    const dispatch = useDispatch();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            KeyPair.fromString(privateKey);
        } catch (err) {
            dispatch(
                showCustomAlert({
                    success: false,
                    messageCodeHeader: 'error',
                    messageCode:
                        'walletErrorCodes.recoverAccountPrivateKey.errorPKNotValid',
                    errorMessage: e.message,
                })
            );
            return;
        }
        await Mixpanel.withTracking(
            'IE-SP Recovery with private key',
            async () => {
                setRecoveringAccount(true);
                await dispatch(recoverAccountSecretKey(privateKey));
                await dispatch(refreshAccount());
            },
            async (e) => {
                if (e.data?.errorCode === 'accountNotExist') {
                    await dispatch(importZeroBalanceAccountPrivateKey(privateKey));
                    dispatch(setZeroBalanceAccountImportMethod('privateKey'));
                    dispatch(clearGlobalAlert());
                    dispatch(redirectToApp());
                } else {
                    showCustomAlert({
                        success: false,
                        messageCodeHeader: 'error',
                        errorMessage: e.message,
                        messageCode: 'account.recoverAccount.errorGeneral',
                    });
                }

                throw e;
            },
            () => {
                setRecoveringAccount(false);
            }
        );

        const fundWithExistingAccount = parseQuery(location.search, {
            parseBooleans: true,
        }).fundWithExistingAccount;
        if (fundWithExistingAccount) {
            const createNewAccountParams = stringify(JSON.parse(fundWithExistingAccount));
            redirectTo(`/fund-with-existing-account?${createNewAccountParams}`);
        } else {
            const options = parseFundingOptions(location.search);
            if (options) {
                const query = parseQuery(location.search);
                const redirectUrl = query.redirectUrl
                    ? `?redirectUrl=${encodeURIComponent(query.redirectUrl)}`
                    : '';
                dispatch(
                    redirectTo(
                        `/linkdrop/${options.fundingContract}/${options.fundingKey}${redirectUrl}`
                    )
                );
            } else {
                dispatch(redirectToApp('/'));
            }
        }

        dispatch(clearAccountState());
    };

    return (
        <StyledContainer className='small-centered border'>
            <h1>
                <Translate id='recoverPrivateKey.pageTitle' />
            </h1>
            <h2>
                <Translate id='recoverPrivateKey.pageText' />
            </h2>
            <form onSubmit={handleSubmit} autoComplete='off'>
                <h4>
                    <Translate id='recoverPrivateKey.privateKeyInput.title' />
                </h4>
                <input
                    value={privateKey}
                    onChange={(e) => {
                        setPrivateKey(e.target.value);
                        dispatch(clearLocalAlert());
                    }}
                    className={classNames([
                        { success: localAlert && localAlert.success },
                        { problem: localAlert && localAlert.success === false },
                    ])}
                    placeholder='ed25519:abc123...'
                    disabled={recoveringAccount}
                    data-test-id='privateKeyRecoveryInput'
                    required
                    tabIndex='2'
                    autoCapitalize='off'
                />
                <FormButton
                    type='submit'
                    color='blue'
                    disabled={recoveringAccount}
                    sending={recoveringAccount}
                    sendingString='button.recovering'
                    data-test-id='privateKeyRecoverySubmitButton'
                >
                    <Translate id='button.findMyAccount' />
                </FormButton>
            </form>
        </StyledContainer>
    );
};

export default RecoverAccountPrivateKey;
