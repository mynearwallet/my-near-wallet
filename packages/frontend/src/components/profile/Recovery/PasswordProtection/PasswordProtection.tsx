import React, { FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import EnterPasswordForm from '../../../accounts/EnterPasswordForm';
import SetPassword from '../../../accounts/SetPassword';
import FormButton from '../../../common/FormButton';
import Modal from '../../../common/modal/Modal';
import Container from '../../../common/styled/Container.css';
import RecoveryMethod from '../RecoveryMethod';
import {
    CreatePasswordDescription,
    CreatePasswordTitle,
    PasswordForm,
    Controls
} from './ui';

type PasswordProtectionProps = {
    isAuthorizedByPassword: boolean;
    onWalletEncrypt: (password: string) => void;
    onWalletDecrypt: (password: string) => void;
}

const PasswordProtection: FC<PasswordProtectionProps> = ({
    isAuthorizedByPassword,
    onWalletEncrypt,
    onWalletDecrypt,
}) => {
    const { t } = useTranslation();

    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [showCreatePass, setShowCreatePass] = useState(false);
    const [password, setPassword] = useState<string|null>(null);

    const toggleConfirmPassModal = useCallback(() =>
        setShowConfirmPass(!showConfirmPass),
    [showConfirmPass]);

    const toggleCreatePassModal = useCallback(() =>
        setShowCreatePass(!showCreatePass),
    [showCreatePass]);

    const handleConfirmDeletePassword = useCallback((password) => {
        toggleConfirmPassModal();
        onWalletDecrypt(password);
    }, [toggleConfirmPassModal]);

    const handleCreateSubmit = useCallback(() => {
        onWalletEncrypt(password);
        toggleCreatePassModal();
    }, [password, toggleCreatePassModal]);

    return (
        <>
            <RecoveryMethod
                title={t('passwordProtection.title')}
                description={t('passwordProtection.description')}
                methodEnabled={isAuthorizedByPassword}
                onEnable={toggleCreatePassModal}
                onDisable={toggleConfirmPassModal}
            />
            {showConfirmPass && (
                /*@ts-ignore*/
                <Modal
                    isOpen={showConfirmPass}
                    onClose={toggleConfirmPassModal}>
                    <Container className='small-centered'>
                        <EnterPasswordForm
                            title={t('enterPassword.title')}
                            onValidPassword={handleConfirmDeletePassword}
                        />
                    </Container>
                </Modal>
            )}
            {showCreatePass && (
                /*@ts-ignore*/
                <Modal
                    isOpen={showCreatePass}
                    onClose={toggleCreatePassModal}>
                    <Container className='small-centered'>
                        <CreatePasswordTitle>
                            {t('setupPasswordProtection.pageTitle')}
                        </CreatePasswordTitle>
                        <CreatePasswordDescription>
                            {t('setupPasswordProtection.pageText')}
                        </CreatePasswordDescription>
                        <PasswordForm>
                            <SetPassword
                                disabled={false}
                                onChange={setPassword} />
                        </PasswordForm>
                        <Controls>
                            <FormButton
                                /*@ts-ignore*/
                                color='light-gray-blue'
                                onClick={toggleCreatePassModal}>
                                {t('button.cancel')}
                            </FormButton>
                            <FormButton
                                /*@ts-ignore*/
                                disabled={password === null}
                                onClick={handleCreateSubmit}>
                                {t('setupPasswordProtection.create')}
                            </FormButton>
                        </Controls>
                    </Container>
                </Modal>
            )}
        </>
    );
};

export default PasswordProtection;
