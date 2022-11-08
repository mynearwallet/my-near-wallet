import React, { FC, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { currentTargetValue, forkEvent } from '../../../../../shared/lib/forms/selectors';
import { isPasswordValid } from '../../../../accounts/EnterPasswordForm/lib/validate';
import { inLength } from '../../../../accounts/SetPassword/lib/validation';
import Modal from '../../../../common/modal/Modal';
import PasswordInput from '../../../../common/PasswordInput';
import { StyledButtons, StyledTitle } from './ui';

type PasswordConfirmationModalActions = {
    onClose: VoidFunction;
    onConfirm: VoidFunction;
};

const PasswordConfirmationModal: FC<PasswordConfirmationModalActions> = ({
    onClose,
    onConfirm,
}) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [isConfirmDisabled, setIsConfirmDisabled] = useState(!inLength(password));

    useEffect(() => {
        setIsConfirmDisabled(!inLength(password));
    }, [password]);

    const [isPasswordError, setIsPasswordError] = useState(false);

    const disablePasswordError = () => setIsPasswordError(false);

    const checkPassword = useCallback(async () => {
        if (!(await isPasswordValid(password))) {
            return setIsPasswordError(true);
        }

        disablePasswordError();
        onConfirm();
    }, [password]);

    return (
        <Modal
            id="password-confirmation-on-remove-account"
            onClose={onClose}
            modalSize="sm"
            isOpen
        >
            <StyledTitle>{t('enterPassword.removeAccountTitle')}</StyledTitle>
            <PasswordInput
                error={isPasswordError && t('enterPassword.error')}
                placeholder={t('enterPassword.passwordPlaceholder')}
                value={password}
                onChange={forkEvent(
                    currentTargetValue(setPassword),
                    disablePasswordError
                )}
            />
            <StyledButtons>
                <button onClick={onClose}>{t('button.cancel')}</button>
                <button
                    className='primary'
                    onClick={checkPassword}
                    disabled={isConfirmDisabled || isPasswordError}
                >
                    {t('button.confirm')}
                </button>
            </StyledButtons>
        </Modal>
    );
};

export default PasswordConfirmationModal;
