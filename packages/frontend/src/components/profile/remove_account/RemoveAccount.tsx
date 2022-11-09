import React, { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Translate } from 'react-localize-redux';
import { useSelector, useDispatch } from 'react-redux';

import TrashIcon from '../../../images/icon-trash';
import { switchAccount } from '../../../redux/actions/account';
import { selectAccountId } from '../../../redux/slices/account';
import { isEncrypted } from '../../../utils/encryption/keys';
import { wallet } from '../../../utils/wallet';
import EnterPasswordForm from '../../accounts/EnterPasswordForm';
import FormButton from '../../common/FormButton';
import Modal from '../../common/modal/Modal';
import { StyledRemoveAccount } from './ui';
import RemoveAccountForm from './ui/RemoveAccountForm';

const modalStyles = {
    maxWidth: '486px',
};

const buttonStyle = {
    marginTop: 0,
};

const RemoveAccount: FC = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const accountId = useSelector(selectAccountId);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const [showRemoveAccountConfirmation, setShowRemoveAccountConfirmation] =
        useState(false);
    const [isModalOpen, setIsModalOpen] = useState(
        showPasswordConfirmation || showRemoveAccountConfirmation
    );

    useEffect(
        () => setIsModalOpen(showPasswordConfirmation || showRemoveAccountConfirmation),
        [showPasswordConfirmation, showRemoveAccountConfirmation]
    );

    const openPasswordConfirmation = () => setShowPasswordConfirmation(true);
    const closePasswordConfirmation = () => setShowPasswordConfirmation(false);

    const openDeletionConfirmation = () => setShowRemoveAccountConfirmation(true);
    const closeDeletionConfirmation = () => {
        closePasswordConfirmation();
        setShowRemoveAccountConfirmation(false);
    };

    const startConfirmation = () => {
        if (isEncrypted()) {
            openPasswordConfirmation();
        } else {
            openDeletionConfirmation();
        }
    };

    const onPasswordConfirmation = () => {
        openDeletionConfirmation();
        closePasswordConfirmation();
    };

    const processAccountDeletion = async () => {
        const walletAccounts = await wallet.removeWalletAccount(accountId);

        if (!Object.keys(walletAccounts).length) {
            location.reload();
        } else {
            dispatch(switchAccount({ accountId: Object.keys(walletAccounts)[0] }));
            closeDeletionConfirmation();
        }
    };

    return (
        <StyledRemoveAccount>
            {/* @ts-ignore */}
            <FormButton color="red" onClick={startConfirmation} style={buttonStyle}>
                <TrashIcon />
                <Translate id="removeAccount.button" />
            </FormButton>

            {isModalOpen && (
                <Modal
                    id="password-confirmation-on-remove-account"
                    onClose={closeDeletionConfirmation}
                    style={modalStyles}
                    isOpen={isModalOpen}
                    closeButton
                >
                    {showPasswordConfirmation && (
                        <EnterPasswordForm
                            title={t('enterPassword.removeAccountTitle')}
                            isRestoreVisible={false}
                            onCancel={closePasswordConfirmation}
                            onValidPassword={onPasswordConfirmation}
                        />
                    )}
                    {showRemoveAccountConfirmation && (
                        <RemoveAccountForm
                            onClose={closeDeletionConfirmation}
                            onRemoveAccount={processAccountDeletion}
                            accountId={accountId}
                        />
                    )}
                </Modal>
            )}
        </StyledRemoveAccount>
    );
};

export default RemoveAccount;
