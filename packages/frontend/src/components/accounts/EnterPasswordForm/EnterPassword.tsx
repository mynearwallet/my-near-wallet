import React, { FC, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
    currentTargetValue,
    forkEvent
} from '../../../shared/lib/forms/selectors';
import FormButton from '../../common/FormButton';
import Modal from '../../common/modal/Modal';
import PasswordInput from '../../common/PasswordInput';
import { isPasswordValid } from './lib/validate';
import RestoreAccountModal from './RestoreAccountModal';
import { Wrapper, Title, Password, Submit, RestoreLink, Footer } from './ui';

const ENTER_KEY = 'Enter';

type EnterPasswordFormProps = {
    title: string;
}

type EnterPasswordFormActions = {
    onValidPassword: (password: string) => void;
    onRestore?: VoidFunction;
    onCancel?: VoidFunction;
}

const EnterPasswordForm: FC<EnterPasswordFormProps & EnterPasswordFormActions> = ({
    title,
    onValidPassword,
    onRestore,
    onCancel,
}) => {
    const { t } = useTranslation();

    const [isError, setIsError] = useState(false);
    const [password, setPassword] = useState('');
    const [showRestoreModal, setShowResoreModal] = useState(false);

    const toggleRestoreModal = useCallback(() =>
        setShowResoreModal(!showRestoreModal),
    [showRestoreModal]);

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
                        disabled={password.length === 0}
                        color='blue'
                        type='button'
                        onClick={handleSubmit}>
                        {t('enterPassword.cancel')}
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

            {onRestore && (
                <Footer onClick={toggleRestoreModal}>
                    {t('enterPassword.forgotPassword')}
                    <RestoreLink>
                        {t('enterPassword.restoreLink')}
                    </RestoreLink>
                </Footer>
            )}

            {showRestoreModal && (
                /*@ts-ignore*/
                <Modal
                    isOpen={showRestoreModal}
                    onClose={toggleRestoreModal}>
                    <RestoreAccountModal
                        onSubmit={onRestore}
                        onCancel={toggleRestoreModal}
                    />
                </Modal>
            )}
        </Wrapper>
    );
};

export default EnterPasswordForm;
