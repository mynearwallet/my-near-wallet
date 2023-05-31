import { getLocation } from 'connected-react-router';
import { parse } from 'query-string';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { Mixpanel } from '../../../mixpanel/index';
import {
    recoverAccountSecretKey,
    refreshAccount,
    redirectTo,
    clearAccountState,
} from '../../../redux/actions/account';
import { hasEncryptedAccount, isNewUser } from '../../../redux/slices/login';
import { isUrlNotJavascriptProtocol } from '../../../utils/helper-api';
import FormButton from '../../common/FormButton';
import Container from '../../common/styled/Container.css';
import Input from '../SetPassword/ui/Input';
import SetPasswordForm from '../SetPasswordForm';
import AutoImport from './AutoImport';

const LoginButtonWrapper = styled.div`
    > button {
        margin: 0;
        width: 100%;
    }
`;

const AutoImportWrapper = ({ secretKey, accountId, mixpanelImportType }) => {
    const dispatch = useDispatch();
    const location = useSelector(getLocation);
    const URLParams = parse(location.search);
    const [recoveryState, setRecoveryState] = useState('idle');
    const [lastSubmitPass, setLastSubmitPass] = useState('');
    const [passwordField, setPasswordField] = useState('none');
    const successUrl = URLParams.success_url;
    const failureUrl = URLParams.failure_url;

    useEffect(() => {
        if (isNewUser()) {
            setPasswordField('confirm');
        } else if (hasEncryptedAccount()) {
            setPasswordField('login');
        } else {
            handleRecoverWithSecretKey();
        }
    }, []);

    const handleRecoverWithSecretKey = async (password) => {
        setRecoveryState('pending');
        await Mixpanel.withTracking(
            `IE-SP Recovery with ${mixpanelImportType} auto`,
            async () => {
                await dispatch(
                    recoverAccountSecretKey(
                        secretKey,
                        accountId,
                        false,
                        password || lastSubmitPass || ''
                    )
                );
                await dispatch(refreshAccount());
                dispatch(clearAccountState());

                if (successUrl && isUrlNotJavascriptProtocol(successUrl)) {
                    window.location.href = successUrl;
                    return;
                }

                await dispatch(redirectTo('/'));
            },
            (e) => {
                setRecoveryState('failed');
                console.error(e);
            }
        );
    };

    const redirectToFailureUrl = () => {
        if (isUrlNotJavascriptProtocol(failureUrl)) {
            window.location.href = failureUrl;
        }
    };

    const submitPassword = async (event) => {
        event.preventDefault();
        const form = event.currentTarget.elements;
        const password = form.new_password.value;
        setLastSubmitPass(password);
        await handleRecoverWithSecretKey(password);
    };

    return (
        <>
            {recoveryState === 'idle' ? (
                <Container className='small-centered border'>
                    <form onSubmit={submitPassword} autoComplete='off'>
                        <h1>Preparing import</h1>
                        <h2>
                            {passwordField === 'confirm'
                                ? 'Create password to import your account'
                                : 'Login to your wallet to continue'}
                        </h2>
                        {passwordField === 'confirm' ? (
                            <SetPasswordForm onSubmit={submitPassword} />
                        ) : (
                            <>
                                <Input
                                    // error
                                    id='new_password'
                                    placeholder="Enter your wallet's password"
                                />

                                <LoginButtonWrapper>
                                    <FormButton type='submit'>Unlock</FormButton>
                                </LoginButtonWrapper>
                            </>
                        )}
                    </form>
                </Container>
            ) : (
                <AutoImport
                    accountId={accountId}
                    recoveryState={recoveryState}
                    // recoveryFailed={recoveryFailed}
                    onClickRecoverWithSecretKey={handleRecoverWithSecretKey}
                    onCancel={failureUrl && redirectToFailureUrl}
                />
            )}
        </>
    );
};

export default AutoImportWrapper;
