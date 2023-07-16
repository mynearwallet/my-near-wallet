import { t } from 'i18next';
import React, { FC, useCallback, useState } from 'react';
import { Translate } from 'react-localize-redux';
import { useHistory } from 'react-router';

import { getEncryptedData } from '../../../utils/localStorage';
import { wallet } from '../../../utils/wallet';
import FormButton from '../../common/FormButton';
import Container from '../../common/styled/Container.css';
import SetPasswordForm from './SetPasswordForm';
import { Submit } from './SetPasswordForm/ui';

type SetPasswordPage = {
    uponSetPassword: () => void;
};

export const SetPasswordPage: FC<SetPasswordPage> = ({ uponSetPassword }) => {
    const history = useHistory();
    const [isEncrypted, setIsEncrypted] = useState<boolean>(
        !!getEncryptedData() && getEncryptedData().isEncryptionEnabled
    );

    // TODO-password-encryption: Maybe add another page to confirm if users' have really encrypted all their wallet
    const onSubmit = async (password: string) => {
        await wallet.enablePasswordEncryption(password);
        setIsEncrypted(!!getEncryptedData() && getEncryptedData().isEncryptionEnabled);
        uponSetPassword();
    };

    const handleClick = useCallback(() => {
        history.push('/');
    }, [history]);

    return (
        <Container className='small-centered border'>
            {isEncrypted ? (
                <div>
                    <h1>
                        <Translate id='setupPasswordProtection.setPasswordSuccessfully' />
                    </h1>
                    <h2>
                        <Translate id='setupPasswordProtection.setPasswordSuccessfullyDescription' />
                    </h2>
                    <Submit>
                        {/* @ts-ignore: prop error */}
                        <FormButton onClick={handleClick}>
                            {t('setupPasswordProtection.setPasswordSuccessfullyButton')}
                        </FormButton>
                    </Submit>
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
