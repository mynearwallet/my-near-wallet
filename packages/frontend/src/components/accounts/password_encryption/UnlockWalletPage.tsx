import React, { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Translate } from 'react-localize-redux';
import Input from './SetPassword/ui/Input';
import { Submit } from './SetPasswordForm/ui';

import { currentTargetValue } from '../../../shared/lib/forms/selectors';
import { wallet } from '../../../utils/wallet';
import FormButton from '../../common/FormButton';
import Container from '../../common/styled/Container.css';

type UnlockWalletPageProps = {
    titleId: string;
    descriptionId: string;
    uponUnlock?: (password: string) => void;
};

export const UnlockWalletPage: FC<UnlockWalletPageProps> = ({
    titleId,
    descriptionId,
    uponUnlock,
}) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState<string>(null);
    const [errorMessage, setErrorMessage] = useState<string>(null);

    const unlockHandler = async () => {
        try {
            setErrorMessage(null);
            await wallet.unlockWallet(password);
            uponUnlock?.(password);
        } catch (e) {
            console.error(e);
            setErrorMessage(t('setupPasswordProtection.invalidPassword'));
        }
    };

    const handleChangePassword = (value: string) => {
        setPassword(value);
    };

    const handleKeyUp = (e) => {
        if (e && e.key === 'Enter' && password.length) {
            unlockHandler();
        }
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
                    data-test-id='password'
                    value={password ?? ''}
                    onChange={currentTargetValue(handleChangePassword)}
                    onKeyUpCapture={handleKeyUp}
                    error={errorMessage}
                />

                <br />
                <br />
                <br />
                <Submit>
                    {/* @ts-ignore: prop error */}
                    <FormButton
                        data-test-id='unlock'
                        onClick={unlockHandler}
                        disabled={!password}
                    >
                        {t('setupPasswordProtection.unlockWalletButton')}
                    </FormButton>
                </Submit>
            </div>
        </Container>
    );
};
