import React, { useMemo, useState } from 'react';
import * as nearApiJs from 'near-api-js';
import { parseSeedPhrase } from 'near-seed-phrase';
import Modal from '../../common/modal/Modal';
import { Translate } from 'react-localize-redux';
import { wallet } from '../../../utils/wallet';
import FormButton from '../../common/FormButton';
import FormButtonGroup from '../../common/FormButtonGroup';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import {
    recoverAccountSecretKey,
    recoverAccountSeedPhrase,
    redirectToApp,
    refreshAccount,
} from '../../../redux/actions/account';
import { EWalletImportInputType } from './type';

type Props = {
    importType: EWalletImportInputType;
    isVisible: boolean;
    setVisible: (val: boolean) => void;
};

export const ModalManualImport = ({ importType, isVisible, setVisible }: Props) => {
    const [seedPhrase, setSeedPhrase] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [accountId, setAccountId] = useState('');
    const [isLoadingValidation, setLoadingValidation] = useState(false);
    const [manualImportModalMsg, setManualImportModalMsg] = useState<{
        status: 'success' | 'error';
        message: string;
    }>({ status: 'error', message: '' });
    const dispatch = useDispatch();

    const publicKey = useMemo(() => {
        if (importType === EWalletImportInputType.SECRET_PHRASE) {
            const { publicKey } = parseSeedPhrase(seedPhrase);
            return publicKey;
        } else if (privateKey && importType === EWalletImportInputType.PRIVATE_KEY) {
            try {
                const keyPair = nearApiJs.KeyPair.fromString(
                    privateKey
                ) as nearApiJs.utils.KeyPairEd25519;
                return keyPair.publicKey.toString();
            } catch (err) {
                console.log('invalid private key');
            }
        }
    }, [seedPhrase, privateKey, importType]);

    async function handleImport() {
        setManualImportModalMsg({
            status: 'error',
            message: '',
        });
        let account;
        setLoadingValidation(true);
        try {
            account = await wallet.getAccount(accountId);
        } catch (err) {
            setLoadingValidation(false);
            setManualImportModalMsg({
                status: 'error',
                message: 'Account does not exist or access key doesnt match',
            });
            return;
        }

        const accessKeys = await account.getAccessKeys();
        const hasMatchPublicKey = accessKeys.some((key) => key.public_key === publicKey);
        if (!hasMatchPublicKey) {
            setLoadingValidation(false);
            setManualImportModalMsg({
                status: 'error',
                message: 'Account does not exist or access key doesnt match',
            });
            return;
        }

        try {
            if (importType === EWalletImportInputType.SECRET_PHRASE) {
                await dispatch(recoverAccountSeedPhrase(seedPhrase, accountId));
            } else if (importType === EWalletImportInputType.PRIVATE_KEY) {
                await dispatch(recoverAccountSecretKey(privateKey, accountId, false));
            }
            // @ts-ignore
            await dispatch(refreshAccount());
            // @ts-ignore
            dispatch(redirectToApp('/'));
        } catch (e) {
            setManualImportModalMsg({
                status: 'error',
                message: e.messageCode,
            });
        }
        setLoadingValidation(false);
    }

    if (!isVisible) {
        return null;
    }

    return (
        // @ts-ignore
        <Modal
            id='modal-manual-import'
            isOpen={isVisible}
            onClose={() => setVisible(false)}
        >
            <Container>
                <h3 className='title'>Manual Import Account</h3>
                {importType === EWalletImportInputType.SECRET_PHRASE ? (
                    <div className='field-section'>
                        <h4 className='field-title'>Secret Phrase</h4>
                        <textarea
                            value={seedPhrase}
                            onChange={(e) => setSeedPhrase(e.target.value)}
                            className='border-gray-400 bg-gray-100 text-gray-800 rounded-md'
                        />
                    </div>
                ) : (
                    <div className='field-section'>
                        <h4 className='field-title'>Private Key</h4>
                        <textarea
                            value={privateKey}
                            onChange={(e) => setPrivateKey(e.target.value)}
                            className='border-gray-400 bg-gray-100 text-gray-800 rounded-md'
                        />
                    </div>
                )}

                <div className='field-section'>
                    <h4 className='field-title'>
                        Insert your account ID here to import your account
                    </h4>
                    <input
                        autoComplete='off'
                        value={accountId}
                        onChange={(e) => {
                            const newAccountId = e.target.value;
                            setAccountId(newAccountId);
                        }}
                        className='border-gray-400 bg-gray-100 text-gray-800 rounded-md'
                    />
                </div>
                <div className='field-section'>
                    <div>
                        <h4>Public key</h4>
                        <input
                            disabled
                            value={!!seedPhrase || !!privateKey ? publicKey : '-'}
                            className='border-gray-400 bg-gray-100 text-gray-800 rounded-md'
                        />
                    </div>
                </div>
                <div
                    style={{
                        color:
                            manualImportModalMsg.status === 'success' ? 'green' : 'red',
                    }}
                >
                    {manualImportModalMsg.message}
                </div>
                <FormButtonGroup>
                    {/* @ts-ignore */}
                    <FormButton
                        color='gray'
                        className='link'
                        onClick={() => setVisible(false)}
                        style={{ marginTop: '20px !important' }}
                    >
                        <Translate id='button.cancel' />
                    </FormButton>
                    {/* @ts-ignore */}
                    <FormButton
                        disabled={isLoadingValidation}
                        sending={isLoadingValidation}
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
    display: flex;
    flex-direction: column;
    gap: 1em;
    .title {
        font-size: 18px;
        font-weight: bold;
    }
    .field-section {
        word-break: break-word;
    }
`;
