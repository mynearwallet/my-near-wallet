import React, { FC } from 'react';
import { Translate } from 'react-localize-redux';
import { useHistory } from 'react-router';
import { v4 as uuidv4 } from 'uuid';

import {
    getEncryptedData,
    removeAllAccountsPrivateKey,
    retrieveAllAccountsPrivateKey,
    setEncryptedData,
} from '../../../utils/localStorage';
import Container from '../../common/styled/Container.css';
import SetPasswordForm from './SetPasswordForm';

export const SetPasswordPage: FC<void> = () => {
    const isEncrypted = !!getEncryptedData();
    const history = useHistory();

    // TODO-password-encryption: Change this to the real encrypt function
    // TODO-password-encryption: Maybe add another page to confirm if users' have really encrypted all their wallet
    const onSubmit = (password: string) => {
        const salt = uuidv4();
        const derivedPassword = password + salt;
        try {
            const accounts = retrieveAllAccountsPrivateKey();
            const encryptedData = JSON.stringify(accounts) + derivedPassword;
            setEncryptedData({ salt, encryptedData });
            history.push('/');
            removeAllAccountsPrivateKey();
        } catch (e) {
            console.error('Something went wrong');
        }
    };

    return (
        <Container className='small-centered border'>
            {isEncrypted ? (
                <div>
                    <h1>
                        <Translate id='setupPasswordProtection.passwordExist' />
                    </h1>
                    <h2>
                        <Translate id='setupPasswordProtection.passwordExistDescription' />
                    </h2>
                </div>
            ) : (
                <div>
                    <h1>
                        <Translate id='setupPasswordProtection.pageTitle' />
                    </h1>
                    <h2>
                        <Translate id='setupPasswordProtection.pageText' />
                    </h2>
                    <SetPasswordForm onSubmit={onSubmit} />
                </div>
            )}
        </Container>
    );
};
