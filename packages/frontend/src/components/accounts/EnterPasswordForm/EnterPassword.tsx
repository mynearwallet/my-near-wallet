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
import { Wrapper, Title, Password, Submit, RestoreLink, Footer } from './ui';

const ENTER_KEY = 'Enter';

type EnterPasswordFormProps = {
    title: string;
    isRestoreVisible?: boolean;
}

type EnterPasswordFormActions = {
    onValidPassword: (password: string) => void;
    onCancel?: VoidFunction;
}

const EnterPasswordForm: FC<EnterPasswordFormProps & EnterPasswordFormActions> = ({
    title,
    isRestoreVisible = true,
    onValidPassword,
    onCancel,
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
            <Title>{title}</Title>

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
                {onCancel && (
                    <FormButton
                        /*@ts-ignore*/
                        color='light-gray-blue'
                        onClick={onCancel}
                    >
                        {t('restoreAccount.cancelCaption')}
                    </FormButton>
                )}
                <FormButton
                    /*@ts-ignore*/
                    disabled={password.length === 0}
                    color='blue'
                    type='button'
                    onClick={handleSubmit}>
                    {t('enterPassword.unlockCaption')}
                </FormButton>
            </Submit>

            {isRestoreVisible && (
                <Footer>
                    {t('enterPassword.forgotPassword')}
                    <RestoreLink>
                        <Link to={`/restore-account?${encodeURIComponent(location.pathname)}`}>
                            {t('enterPassword.restoreLink')}
                        </Link>
                    </RestoreLink>
                </Footer>
            )}
        </Wrapper>
    );
};

export default EnterPasswordForm;
