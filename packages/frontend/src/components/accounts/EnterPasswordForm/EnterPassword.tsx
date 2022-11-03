import React, { FC, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
    currentTargetValue,
    forkEvent
} from '../../../shared/lib/forms/selectors';
import FormButton from '../../common/FormButton';
import PasswordInput from '../../common/PasswordInput';
import { isPasswordValid } from './lib/validate';
import { Wrapper, Title, Password, Submit, Footer } from './ui';

const ENTER_KEY = 'Enter';

type EnterPasswordFormProps = {
    onValidPassword: (password: string) => void;
}

const EnterPasswordForm: FC<EnterPasswordFormProps> = ({
    onValidPassword,
}) => {
    const { t } = useTranslation();

    const [isError, setIsError] = useState(false);
    const [password, setPassword] = useState('');

    const disableError = useCallback(() => setIsError(false), []);

    const handleSubmit = useCallback(async () => {
        if (!await isPasswordValid(password)) {
            setIsError(true);

            return;
        }

        disableError();
        onValidPassword(password);
    }, [password, onValidPassword]);

    const handleKeyPress = useCallback((event: KeyboardEvent) => {
        if (event.key === ENTER_KEY) {
            handleSubmit();
        }
    }, [handleSubmit]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyPress);

        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);

    return (
        <Wrapper>
            <Title>{t('enterPassword.title')}</Title>

            <Password>
                <PasswordInput
                    error={isError && t('enterPassword.error')}
                    placeholder={t('enterPassword.passwordPlaceholder')}
                    value={password}
                    onChange={forkEvent(
                        currentTargetValue(setPassword),
                        disableError
                    )}
                />
            </Password>

            <Submit>
                <FormButton
                    color='light-gray-gray'
                    type='button'
                    onClick={handleSubmit}>
                    {t('enterPassword.unlockCaption')}
                </FormButton>
            </Submit>

            <Footer>
                {t('enterPassword.forgotPassword')}
                <Link to='/recover-seed-phrase'>
                    {t('enterPassword.restoreLink')}
                </Link>
            </Footer>
        </Wrapper>
    );
};

export default EnterPasswordForm;
