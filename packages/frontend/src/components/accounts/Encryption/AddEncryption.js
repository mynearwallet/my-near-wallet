import qs from 'query-string';
import React from 'react';
import { Translate } from 'react-localize-redux';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router';

import {
    navigateToNextRouteAndSavePassword,
    upgradeToEncryption,
} from '../../../redux/slices/login';
import Container from '../../common/styled/Container.css';
import SetPasswordForm from '../SetPasswordForm';

export const AddEncryption = () => {
    const dispatch = useDispatch();
    const { search, hash } = useLocation();

    const handleSubmitPasswordStep = async (event) => {
        event.preventDefault();
        const form = event.currentTarget.elements;
        const hasEncryptedAccount = !!localStorage.getItem('NEAR_WALLET_ENCRYPTED');
        if (hasEncryptedAccount) {
            alert('Invalid state, navigating back to root');
            return;
        }
        const password = form.new_password.value;
        const searchParsed = qs.parse(search);
        if (searchParsed.next) {
            dispatch(
                navigateToNextRouteAndSavePassword({
                    nextRoute: searchParsed.next,
                    password,
                    hash,
                })
            );
        } else {
            dispatch(upgradeToEncryption(password));
        }
    };

    return (
        <Container className='small-centered border'>
            <form onSubmit={handleSubmitPasswordStep} autoComplete='off'>
                <h1>
                    <Translate id='setupPasswordProtection.pageTitle' />
                </h1>
                <h2>
                    <Translate id='setupPasswordProtection.pageText' />
                </h2>
                <SetPasswordForm onSubmit={handleSubmitPasswordStep} />
            </form>
        </Container>
    );
};
