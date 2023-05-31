import React from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router';
import styled from 'styled-components';

import { login, navigateToNextRouteAndSavePassword } from '../../../redux/slices/login';
import FormButton from '../../common/FormButton';
import Container from '../../common/styled/Container.css';
import Input from '../SetPassword/ui/Input';

const LoginButtonWrapper = styled.div`
    > button {
        margin: 0;
        width: 100%;
    }
`;

export const LoginWallet = () => {
    const dispatch = useDispatch();
    const { state } = useLocation();

    const handleLogin = async (event) => {
        event.preventDefault();
        const form = event.currentTarget.elements;
        const password = form.password.value;
        const success = await dispatch(login(password));
        if (success && state?.next) {
            dispatch(
                navigateToNextRouteAndSavePassword({
                    password: password,
                    hash: location.hash,
                    nextRoute: state.next,
                })
            );
        }
    };

    return (
        <Container className='small-centered border'>
            <form onSubmit={handleLogin} autoComplete='off'>
                <h1>{state?.title || 'Unlock'}</h1>
                <h2>{state?.desc || 'Unlock your wallet'}</h2>
                <Input
                    // error
                    id='password'
                    placeholder="Enter your wallet's password"
                />
                <LoginButtonWrapper>
                    <FormButton type='submit'>Unlock</FormButton>
                </LoginButtonWrapper>
            </form>
        </Container>
    );
};
