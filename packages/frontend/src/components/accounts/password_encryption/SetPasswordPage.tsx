import { t } from 'i18next';
import React, { FC, useCallback } from 'react';
import { Translate } from 'react-localize-redux';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router';

import { selectPasswordProtectionSlice } from '../../../redux/slices/passwordProtectedWallet/passwordProtectedWallet';
import { wallet } from '../../../utils/wallet';
import FormButton from '../../common/FormButton';
import Container from '../../common/styled/Container.css';
import SetPasswordForm from './SetPasswordForm';
import { Submit } from './SetPasswordForm/ui';

export const SetPasswordPage: FC = () => {
    const history = useHistory();
    const { dataStatus } = useSelector(selectPasswordProtectionSlice);

    const onSubmit = async (password: string) => {
        await wallet.enablePasswordEncryption(password);
    };

    const handleClick = useCallback(() => {
        history.push('/');
    }, [history]);

    return (
        <Container className='small-centered border'>
            {dataStatus.hasEncryptedData ? (
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
