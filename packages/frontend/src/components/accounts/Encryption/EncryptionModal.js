import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';

import FormButton from '../../common/FormButton';
import FormButtonGroup from '../../common/FormButtonGroup';
import Modal from '../../common/modal/Modal';
import { ModalContainer } from '../batch_import_accounts/styles';

export const MODAL_CHECKED_KEY = 'CANCEL_ENCRYPT_KEY';

const EncryptionModal = () => {
    const [open, setOpen] = useState(false);
    const history = useHistory();

    const handleCancelClose = () => {
        setOpen(false);
        localStorage.setItem(MODAL_CHECKED_KEY, 'true');
    };

    useEffect(() => {
        // TODO: set to false if it is encrypted account already
        const checked = localStorage.getItem(MODAL_CHECKED_KEY);
        const encrypted = localStorage.getItem('NEAR_WALLET_ENCRYPTED');
        const hasNormalAccount = Object.keys({ ...localStorage }).some((e) =>
            e.includes('nearlib:keystore:')
        );
        if (checked !== 'true' && !encrypted && hasNormalAccount) {
            setOpen(true);
        }
    }, []);

    const navigateToCreatePassword = () => {
        setOpen(false);
        history.push('/set-encryption');
    };

    if (!open) {
        return null;
    }

    return (
        <Modal
            id='encryption-upgrade-modal'
            isOpen={open}
            onClose={() => {
                setOpen(false);
            }}
            closeButton='desktop'
            modalSize=''
            modalClass=''
            disableClose={false}
            data-test-id={null}
            style={null}
        >
            <ModalContainer>
                <h3>Upgrade to encrypted private key!</h3>
                <p>
                    We are pleased to announce that we have enabled password encrypted
                    private key for MyNearWallet!
                </p>

                <FormButtonGroup>
                    <FormButton onClick={handleCancelClose} className='gray-blue'>
                        Cancel
                    </FormButton>
                    <FormButton onClick={navigateToCreatePassword}>
                        Upgrade now
                    </FormButton>
                </FormButtonGroup>
            </ModalContainer>
        </Modal>
    );
};

export default EncryptionModal;
