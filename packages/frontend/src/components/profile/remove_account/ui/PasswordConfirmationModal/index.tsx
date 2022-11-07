import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { Title } from '../';
import Modal from '../../../../common/modal/Modal';
import { StyledButtons } from './ui';

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
            modalSize="sm"
            isOpen
        >
            <Title>{t('enterPassword.removeAccountTitle')}</Title>
            <input type="text" />
            <StyledButtons></StyledButtons>
        </Modal>
    );
};

export default PasswordConfirmationModal;
