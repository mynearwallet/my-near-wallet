import React, { useState } from 'react';
import { parseSeedPhrase } from 'near-seed-phrase';
import Modal from '../../common/modal/Modal';
import { Translate } from 'react-localize-redux';
import { wallet } from '../../../utils/wallet';
import FormButton from '../../common/FormButton';
import FormButtonGroup from '../../common/FormButtonGroup';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { showCustomAlert } from '../../../redux/actions/status';
import { recoverAccountSeedPhrase, refreshAccount } from '../../../redux/actions/account';

type Props = {
    isVisible: boolean;
    setVisible: (val: boolean) => void;
};

export const ModalManualImport = ({ isVisible, setVisible }: Props) => {
    const [seedPhrase, setSeedPhrase] = useState('');
    const [accountId, setAccountId] = useState('');
    const dispatch = useDispatch();

    async function handleImport() {
        const account = await wallet.getAccount(accountId);

        const accessKeys = await account.getAccessKeys();
        console.log({ accessKeys });
        const { publicKey } = parseSeedPhrase(seedPhrase);
        const hasMatchPublicKey = accessKeys.some((key) => key.public_key === publicKey);
        if (!hasMatchPublicKey) {
            dispatch(
                showCustomAlert({
                    success: false,
                    messageCodeHeader: 'error',
                    messageCode: '',
                    errorMessage: 'Account does not exist or access key doesnt match',
                })
            );
            return;
        }

        try {
            await recoverAccountSeedPhrase(seedPhrase);
            await refreshAccount();
        } catch (e) {
            showCustomAlert({
                success: false,
                messageCodeHeader: 'error',
                errorMessage: e.message,
                messageCode: e.messageCode,
            });
        }
    }

    return (
        <Modal isOpen={isVisible} onClose={() => setVisible(false)}>
            <Container>
                <h3 className='title'>Manual Import Account</h3>
                <h4 className='field-title'>Secret Phrase</h4>
                <textarea
                    value={seedPhrase}
                    onChange={(e) => setSeedPhrase(e.target.value)}
                    className='border-gray-400 bg-gray-100 text-gray-800 rounded-md'
                />
                <h4 className='field-title'>
                    Insert your account ID here to import your account
                </h4>
                <input
                    autoComplete='off'
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className='border-gray-400 bg-gray-100 text-gray-800 rounded-md'
                />
                <FormButtonGroup>
                    <FormButton
                        color='gray'
                        className='mt-3 link'
                        onClick={() => setVisible(false)}
                    >
                        <Translate id='button.cancel' />
                    </FormButton>
                    <FormButton
                        disabled={false}
                        sending={false}
                        onClick={handleImport}
                        data-test-id='manualImportSubmitButton'
                    >
                        <Translate id='button.acceptAndContinue' />
                    </FormButton>
                </FormButtonGroup>
            </Container>
        </Modal>
    );
};

const Container = styled.div`
    .title {
        font-size: 18px;
        font-weight: bold;
    }
    .field-title {
        margin-top: 10px;
    }
`;
