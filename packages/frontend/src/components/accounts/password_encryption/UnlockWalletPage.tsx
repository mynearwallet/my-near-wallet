import React, { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Translate } from 'react-localize-redux';
import { useDispatch } from 'react-redux';

import passwordEncryptionSlice, {
    TDecryptedData,
} from '../../../redux/slices/passwordEncryption/passwordEncryptionSlice';
import { currentTargetValue } from '../../../shared/lib/forms/selectors';
import { getEncryptedData, TEncryptedData } from '../../../utils/localStorage';
import FormButton from '../../common/FormButton';
import Container from '../../common/styled/Container.css';
import Input from './SetPassword/ui/Input';
import { Submit } from './SetPasswordForm/ui';

type UnlockWalletPageProps = {
    uponUnlock: () => void;
};

export const UnlockWalletPage: FC<UnlockWalletPageProps> = ({ uponUnlock }) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState<string>(null);
    const [errorMessage, setErrorMessage] = useState<string>(null);
    const dispatch = useDispatch();

    // TODO-password-encryption: Change this to the real decrypt function
    const unlockHandler = (encryptedData: TEncryptedData, password: string): boolean => {
        const { salt, encryptedData: encryptedDataString } = encryptedData;
        const decryptedData = encryptedDataString.replace(password + salt, '');
        try {
            const accounts: TDecryptedData = JSON.parse(decryptedData);
            dispatch(passwordEncryptionSlice.actions.decrypt(accounts));
            return true;
        } catch (e) {
            return false;
        }
    };

    // TODO-password-encryption:
    const handleClickNext = () => {
        const encryptedData = getEncryptedData();
        const decryption = unlockHandler(encryptedData, password);
        if (decryption) {
            uponUnlock();
            setErrorMessage(null);
        } else {
            setErrorMessage(t('setupPasswordProtection.invalidPassword'));
        }
    };

    const handleChangePassword = (value: string) => {
        setPassword(value);
    };

    return (
        <Container className='small-centered border'>
            <div>
                <h1>
                    <Translate id='setupPasswordProtection.unlockWalletTitle' />
                </h1>
                <h2>
                    <Translate id='setupPasswordProtection.unlockWalletDescription' />
                </h2>

                <Input
                    placeholder={t(
                        'setupPasswordProtection.unlockWalletInputPlaceholder'
                    )}
                    value={password ?? ''}
                    onChange={currentTargetValue(handleChangePassword)}
                    error={errorMessage}
                />

                <Submit>
                    {/* @ts-ignore: prop error */}
                    <FormButton onClick={handleClickNext} disabled={!password}>
                        {t('setupPasswordProtection.unlockWalletButton')}
                    </FormButton>
                </Submit>
            </div>
        </Container>
    );
};
