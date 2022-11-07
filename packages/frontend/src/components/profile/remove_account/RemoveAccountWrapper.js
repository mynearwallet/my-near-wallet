import React, { useState } from 'react';
import { Translate } from 'react-localize-redux';
import { useSelector, useDispatch } from 'react-redux';

import RemoveAccountImage from '../../../images/icon-trash.js';
import { switchAccount } from '../../../redux/actions/account';
import { selectAccountId } from '../../../redux/slices/account';
import { isEncrypted } from '../../../utils/encryption/keys';
import { wallet } from '../../../utils/wallet';
import FormButton from '../../common/FormButton';
import { StyledRemoveAccount } from './ui';
import PasswordConfirmationModal from './ui/PasswordConfirmationModal';
import RemoveAccountModal from './ui/RemoveAccountModal';

const RemoveAccountWrapper = () => {
    const dispatch = useDispatch();
    const accountId = useSelector(selectAccountId);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const [showRemoveAccountModal, setShowRemoveAccountModal] = useState(false);

    const openPasswordConfirmation = () => setShowPasswordConfirmation(true);
    const closePasswordConfirmation = () => setShowPasswordConfirmation(false);

    const openDeletionConfirmation = () => setShowRemoveAccountModal(true);
    const closeDeletionConfirmation = () => setShowRemoveAccountModal(false);

    const startConfirmation = () => {
        if (isEncrypted()) {
            openPasswordConfirmation();
        } else {
            openDeletionConfirmation();
        }
    };

    const onPasswordConfirmation = () => {
        closePasswordConfirmation();
        openDeletionConfirmation();
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
            <FormButton color="red" onClick={startConfirmation} style={{ marginTop: 0 }}>
                <RemoveAccountImage className="remove-account-icon" />
                <Translate id="removeAccount.button" />
            </FormButton>

            {showPasswordConfirmation && (
                <PasswordConfirmationModal
                    onClose={closePasswordConfirmation}
                    onConfirm={onPasswordConfirmation}
                />
            )}

            {showRemoveAccountModal && (
                <RemoveAccountModal
                    onClose={closeDeletionConfirmation}
                    onRemoveAccount={processAccountDeletion}
                    isOpen={showRemoveAccountModal}
                    accountId={accountId}
                />
            )}
        </StyledRemoveAccount>
    );
};

export default RemoveAccountWrapper;
