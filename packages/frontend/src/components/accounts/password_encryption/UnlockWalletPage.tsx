import React, { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Translate } from 'react-localize-redux';

import { currentTargetValue } from '../../../shared/lib/forms/selectors';
import { EncryptionDecryptionUtils } from '../../../utils/encryption';
import { wallet } from '../../../utils/wallet';
import FormButton from '../../common/FormButton';
import Container from '../../common/styled/Container.css';
import Input from './SetPassword/ui/Input';
import { Submit } from './SetPasswordForm/ui';

type UnlockWalletPageProps = {
    titleId: string;
    descriptionId: string;
    uponUnlock: (password: string) => void;
};

export const UnlockWalletPage: FC<UnlockWalletPageProps> = ({
    uponUnlock,
    titleId,
    descriptionId,
}) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState<string>(null);
    const [errorMessage, setErrorMessage] = useState<string>(null);

    const unlockHandler = async () => {
        try {
            setErrorMessage(null);
            const derivedPassword = await EncryptionDecryptionUtils.generateHash(
                password
            );
            await wallet.unlockWallet(derivedPassword);
            await uponUnlock(password);
        } catch (e) {
            console.error(e);
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
                    <Translate id={titleId} />
                </h1>
                <h2>
                    <Translate id={descriptionId} />
                </h2>

                <Input
                    placeholder={t(
                        'setupPasswordProtection.unlockWalletInputPlaceholder'
                    )}
                    value={password ?? ''}
                    onChange={currentTargetValue(handleChangePassword)}
                    error={errorMessage}
                />

                <br />
                <br />
                <br />
                <Submit>
                    {/* @ts-ignore: prop error */}
                    <FormButton onClick={unlockHandler} disabled={!password}>
                        {t('setupPasswordProtection.unlockWalletButton')}
                    </FormButton>
                </Submit>
            </div>
        </Container>
    );
};
