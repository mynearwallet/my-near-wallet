import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';

import EnterPasswordForm from '../../../../accounts/EnterPasswordForm';
import Modal from '../../../../common/modal/Modal';

type PasswordConfirmationModalActions = {
    onClose: VoidFunction;
    onConfirm: VoidFunction;
};

const PasswordConfirmationModal: FC<PasswordConfirmationModalActions> = ({
    onClose,
    onConfirm,
}) => {
    const { t } = useTranslation();

    return (
        <Modal
            id="password-confirmation-on-remove-account"
            onClose={onClose}
            isOpen
        >
            <EnterPasswordForm
                title={t('enterPassword.removeAccountTitle')}
                onCancel={onClose}
                onValidPassword={onConfirm}
            />
        </Modal>
    );
};

export default PasswordConfirmationModal;
