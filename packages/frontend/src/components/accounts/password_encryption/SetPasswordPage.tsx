import React, { FC } from 'react';
import { Translate } from 'react-localize-redux';

import { getEncryptedData } from '../../../utils/localStorage';
import { wallet } from '../../../utils/wallet';
import Container from '../../common/styled/Container.css';
import SetPasswordForm from './SetPasswordForm';

type SetPasswordPage = {
    uponSetPassword: () => void;
};

export const SetPasswordPage: FC<SetPasswordPage> = ({ uponSetPassword }) => {
    const isEncrypted = !!getEncryptedData() && getEncryptedData().isEncryptionEnabled;

    // TODO-password-encryption: Maybe add another page to confirm if users' have really encrypted all their wallet
    const onSubmit = (password: string) => {
        wallet.enableEncryption(password);
        uponSetPassword();
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
