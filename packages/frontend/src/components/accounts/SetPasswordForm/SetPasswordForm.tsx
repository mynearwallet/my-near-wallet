import React, { FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';


import FormButton from '../../common/FormButton';
import Modal from '../../common/modal/Modal';
import SetPassword from '../SetPassword';
import {
    WithoutPassword,
    PasswordForm,
    Submit,
    SkipTitle,
    SkipDescription,
    SkipForm,
    SkipControls
} from './ui';

type SetPasswordFormProps = {
    loading: boolean;
    onSubmit: (password: string) => void;
}

const SetPasswordForm: FC<SetPasswordFormProps> = ({ loading, onSubmit }) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState(null);
    const [showSkipModal, setShowSkipModal] = useState(false);
    const toggleModal = useCallback(() =>
        setShowSkipModal(!showSkipModal), [showSkipModal])

    const handlePasswordChange = useCallback((value) => {
        setPassword(value);
    }, []);

    const handleClickNext = useCallback((e) => {
        e.preventDefault();
        onSubmit(password);
    }, [password]);

    const handleSkip = useCallback(() => {
        toggleModal();
        onSubmit(null);
    }, [toggleModal]);

    return (
        <>
            <PasswordForm>
                <SetPassword
                    disabled={loading}
                    onChange={handlePasswordChange} />
            </PasswordForm>
            <Submit>
                <FormButton
                    onClick={handleClickNext}
                    sending={loading}
                    disabled={password === null || loading}>
                    {t('button.next')}
                </FormButton>
            </Submit>
            <WithoutPassword
                hide={password !== null}
                onClick={toggleModal}>
                {t('setupPasswordProtection.withoutPassword')}
            </WithoutPassword>
            {showSkipModal && (
                <Modal
                    isOpen={showSkipModal}
                    onClose={toggleModal}>
                    <SkipForm>
                        <SkipTitle>
                            Skip Password Protection
                        </SkipTitle>
                        <SkipDescription>
                            Are you sure you want to skip setting a password to protect your wallet from unauthorized access? You can set a password later from settings page.
                        </SkipDescription>
                        <SkipControls>
                            <FormButton
                                color='light-gray-blue'
                                onClick={toggleModal}>
                                Use Password
                            </FormButton>
                            <FormButton
                                onClick={handleSkip}>
                                Skip Password
                            </FormButton>
                        </SkipControls>
                    </SkipForm>
                </Modal>
            )}
        </>
    );
};

export default SetPasswordForm;
