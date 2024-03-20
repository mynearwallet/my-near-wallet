import { faPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import bip39 from 'bip39-light';
import * as nearApiJs from 'near-api-js';
import { parseSeedPhrase } from 'near-seed-phrase';
import React from 'react';
import { Translate } from 'react-localize-redux';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import makePublicKeyNameStorage from './makePublicKeyNameStorage';
import { store } from '../../..';
import CONFIG from '../../../config';
import {
    getAccessKeys,
    recoverAccountSecretKey,
    refreshAccount,
    removeAccessKey,
} from '../../../redux/actions/account';
import { showCustomAlert } from '../../../redux/actions/status';
import {
    selectAccountId,
    selectAccountFullAccessKeys,
} from '../../../redux/slices/account';
import {
    actions as ledgerActions,
    selectLedgerConnectionModalType,
} from '../../../redux/slices/ledger';
import { ledgerManager } from '../../../utils/ledgerManager';
import { setLedgerHdPath } from '../../../utils/localStorage';
import { unsetKeyMeta, wallet } from '../../../utils/wallet';
import FormButton from '../../common/FormButton';
import FormButtonGroup from '../../common/FormButtonGroup';
import { ConfirmDeAuthorizeBox } from './ConfirmDeAuthorizeBox';
import { ConfirmRotateBox } from './ConfirmRotateBox';

const { checkAndHideLedgerModal } = ledgerActions;

const Container = styled.div`
    &&& {
        border: 2px solid #f0f0f0;
        border-radius: 8px;
        padding: 20px;

        .title {
            color: #3f4045;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: space-between;

            > button {
                margin: 0;
            }
        }

        .key {
            color: #3f4045;
            background-color: #fafafa;
            border: 1px solid #f0f0f1;
            border-radius: 4px;
            padding: 8px;
            font-size: 12px;
            word-break: break-all;
        }

        hr {
            border-style: dashed !important;
            border-color: #f0f0f0;
            margin: 15px 0 !important;
        }

        .fee {
            display: flex;
            align-items: center;
            justify-content: space-between;

            span {
                :first-of-type {
                    color: #72727a;
                }

                :last-of-type {
                    color: #272729;
                    font-weight: 600;
                    text-align: right;
                }
            }
        }
    }
`;

const Link = styled.div`
    a {
        display: block;
        width: 100%;
        text-align: left;
        text-decoration: underline;
        @media (max-width: 992px) {
            text-align: start;
        }
        @media (max-width: 580px) {
            text-align: center;
        }
    }
`;

const bip39SeedPhrasePattern = /^(\w+\s+){11,23}\w+$/;
const ed25519PrivateKeyPattern =
    /^(ed25519:)?[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{88}$/;

const FullAccessKeyRotation = ({ fullAccessKey }) => {
    const dispatch = useDispatch();
    const ledgerConnectionModalType = useSelector(selectLedgerConnectionModalType);

    const [confirmDeAuthorize, setConfirmDeAuthorize] = React.useState(false);
    const [confirmRotate, setConfirmRotate] = React.useState(false);
    const [deAuthorizing, setDeAuthorizing] = React.useState(false);
    const [rotating, setRotating] = React.useState(false);
    const [inputSeedPhrase, setInputSeedPhrase] = React.useState('');
    const [inputSeedPhraseSuccess, setInputSeedPhraseSuccess] = React.useState('');
    const [inputSeedPhraseError, setInputSeedPhraseError] = React.useState('');
    const [publicKey, setPublicKey] = React.useState('');
    const [editName, setEditName] = React.useState(false);
    const [inputName, setInputName] = React.useState('');
    const [usingLedger, setUsingLedger] = React.useState(false);
    const [ledgerPath, setLedgerPath] = React.useState('1');
    const [ledgerConnected, setLedgerConnected] = React.useState(false);

    const fullAccessKeys = useSelector(selectAccountFullAccessKeys);

    const accountId = useSelector(selectAccountId);

    const publicKeyNameStorage = makePublicKeyNameStorage(fullAccessKey.public_key);

    React.useEffect(() => {
        setLedgerConnected(ledgerManager.available);
    }, [ledgerConnectionModalType]);

    React.useEffect(() => {
        wallet.signer
            .getPublicKey(accountId, CONFIG.NETWORK_ID)
            .then((publicKey) => publicKey.toString())
            .then((publicKey) => setPublicKey(publicKey));
    }, [accountId, wallet.signer]);

    function clearInputSeedPhrase() {
        setInputSeedPhrase('');
        setInputSeedPhraseSuccess('');
        setInputSeedPhraseError('');
    }

    function validateInputSeedPhrase(newInput) {
        if (newInput.length === 0) {
            clearInputSeedPhrase();
            return;
        }

        setInputSeedPhrase(newInput);

        let inputSecretKey;

        if (ed25519PrivateKeyPattern.test(newInput.trim())) {
            inputSecretKey = newInput;
        } else if (bip39SeedPhrasePattern.test(newInput.trim())) {
            try {
                bip39.validateMnemonic(newInput.trim());
                inputSecretKey = parseSeedPhrase(newInput).secretKey;
            } catch (err) {
                setInputSeedPhraseError('fullAccessKeys.warning.invalidSeedPhrase');
                setInputSeedPhraseSuccess('');
                return;
            }
        } else {
            setInputSeedPhraseError('fullAccessKeys.warning.invalidFormat');
            setInputSeedPhraseSuccess('');
            return;
        }

        const inputKeyPair = nearApiJs.KeyPair.fromString(inputSecretKey);
        const inputPublicKey = inputKeyPair.publicKey.toString();

        if (inputPublicKey === fullAccessKey.public_key) {
            if (confirmDeAuthorize) {
                setInputSeedPhraseError(
                    'fullAccessKeys.deAuthorizeConfirm.sameKeyWarning'
                );
            } else if (confirmRotate) {
                setInputSeedPhraseError(
                    'fullAccessKeys.deAuthorizeConfirm.sameKeyWarning'
                );
            }
            setInputSeedPhraseSuccess('');
            return;
        }

        if (
            fullAccessKeys.filter((accessKey) => accessKey.public_key === inputPublicKey)
                .length === 0
        ) {
            setInputSeedPhraseError('fullAccessKeys.warning.invalidKey');
            setInputSeedPhraseSuccess('');
            return;
        }

        setInputSeedPhraseError('');
        setInputSeedPhraseSuccess(inputPublicKey);
    }

    async function deauthorizeKey() {
        setDeAuthorizing(true);

        try {
            let inputPublicKey;

            if (usingLedger) {
                if (!ledgerConnected) {
                    return;
                }

                const publicKey = await wallet.getLedgerPublicKey(
                    `44'/397'/0'/0'/${ledgerPath}'`
                );

                inputPublicKey = publicKey.toString();
            } else {
                let inputSecretKey;

                if (ed25519PrivateKeyPattern.test(inputSeedPhrase.trim())) {
                    inputSecretKey = inputSeedPhrase.trim();
                } else if (bip39SeedPhrasePattern.test(inputSeedPhrase.trim())) {
                    try {
                        bip39.validateMnemonic(inputSeedPhrase.trim());
                        inputSecretKey = parseSeedPhrase(
                            inputSeedPhrase.trim()
                        ).secretKey;
                    } catch (err) {
                        throw new Error(
                            'The seed phrase you entered is not a valid seed phrase, its checksum is wrong.'
                        );
                    }
                } else {
                    throw new Error('We can not detect the key format you entered.');
                }

                const inputKeyPair = nearApiJs.KeyPair.fromString(inputSecretKey);
                inputPublicKey = inputKeyPair.publicKey.toString();
            }

            if (inputPublicKey === fullAccessKey.public_key) {
                throw new Error(
                    'The key you trying to deauthorize is the same key with the seed phrase you entered'
                );
            }

            if (
                fullAccessKeys.filter(
                    (accessKey) => accessKey.public_key === inputPublicKey
                ).length === 0
            ) {
                throw new Error(
                    'The key you entered is not a valid recovery key for this account'
                );
            }

            await dispatch(removeAccessKey(fullAccessKey.public_key));
            await unsetKeyMeta(fullAccessKey.public_key);
            await dispatch(getAccessKeys());
        } catch (error) {
            dispatch(
                showCustomAlert({
                    success: false,
                    messageCodeHeader: 'error',
                    messageCode: 'fullAccessKeys.deAuthorizeConfirm.title',
                    errorMessage: error.message,
                })
            );
        } finally {
            store.dispatch(checkAndHideLedgerModal());
            setDeAuthorizing(false);
        }
    }

    async function rotateKey() {
        setRotating(true);

        try {
            let inputPublicKey;
            let inputKeyPair;

            if (usingLedger) {
                if (!ledgerConnected) {
                    return;
                }

                const publicKey = await wallet.getLedgerPublicKey(
                    `44'/397'/0'/0'/${ledgerPath}'`
                );

                inputPublicKey = publicKey.toString();
            } else {
                let inputSecretKey;

                if (ed25519PrivateKeyPattern.test(inputSeedPhrase.trim())) {
                    inputSecretKey = inputSeedPhrase.trim();
                } else if (bip39SeedPhrasePattern.test(inputSeedPhrase.trim())) {
                    try {
                        bip39.validateMnemonic(inputSeedPhrase.trim());
                        inputSecretKey = parseSeedPhrase(
                            inputSeedPhrase.trim()
                        ).secretKey;
                    } catch (err) {
                        throw new Error(
                            'The seed phrase you entered is not a valid seed phrase, its checksum is wrong.'
                        );
                    }
                } else {
                    throw new Error('We can not detect the key format you entered.');
                }

                inputKeyPair = nearApiJs.KeyPair.fromString(inputSecretKey);
                inputPublicKey = inputKeyPair.publicKey.toString();
            }

            if (inputPublicKey === fullAccessKey.public_key) {
                throw new Error(
                    'You are already using this key. There is no need to rotate.'
                );
            }

            if (
                fullAccessKeys.filter(
                    (accessKey) => accessKey.public_key === inputPublicKey
                ).length === 0
            ) {
                throw new Error(
                    'The key you entered is not a valid recovery key for this account'
                );
            }

            const oldPublicKey = publicKey;

            if (usingLedger) {
                setLedgerHdPath({ accountId, path: `44'/397'/0'/0'/${ledgerPath}'` });
                await wallet.addLedgerAccountId({ accountId });
            } else {
                await dispatch(
                    recoverAccountSecretKey(inputKeyPair.secretKey.toString())
                );
            }
            await unsetKeyMeta(oldPublicKey);
            await dispatch(refreshAccount());
        } catch (error) {
            dispatch(
                showCustomAlert({
                    success: false,
                    messageCodeHeader: 'error',
                    messageCode: 'fullAccessKeys.rotateKey.title',
                    errorMessage: error.message,
                })
            );
        } finally {
            setRotating(false);
        }
    }

    const createdAt = new Date(fullAccessKey?.created?.block_timestamp / 1000000);

    const transactionHash = fullAccessKey?.created?.transaction_hash;

    return (
        <Container className='authorized-app-box'>
            {confirmDeAuthorize ? (
                <ConfirmDeAuthorizeBox
                    deauthorizeKey={deauthorizeKey}
                    fullAccessKey={fullAccessKey}
                    usingLedger={usingLedger}
                    setUsingLedger={setUsingLedger}
                    ledgerConnected={ledgerConnected}
                    ledgerPath={ledgerPath}
                    setLedgerPath={setLedgerPath}
                    inputSeedPhrase={inputSeedPhrase}
                    validateInputSeedPhrase={validateInputSeedPhrase}
                    inputSeedPhraseSuccess={inputSeedPhraseSuccess}
                    inputSeedPhraseError={inputSeedPhraseError}
                    clearInputSeedPhrase={clearInputSeedPhrase}
                    deAuthorizing={deAuthorizing}
                    setConfirmDeAuthorize={setConfirmDeAuthorize}
                />
            ) : confirmRotate ? (
                <ConfirmRotateBox
                    fullAccessKey={fullAccessKey}
                    rotateKey={rotateKey}
                    usingLedger={usingLedger}
                    setUsingLedger={setUsingLedger}
                    ledgerConnected={ledgerConnected}
                    ledgerPath={ledgerPath}
                    setLedgerPath={setLedgerPath}
                    inputSeedPhrase={inputSeedPhrase}
                    validateInputSeedPhrase={validateInputSeedPhrase}
                    inputSeedPhraseSuccess={inputSeedPhraseSuccess}
                    inputSeedPhraseError={inputSeedPhraseError}
                    clearInputSeedPhrase={clearInputSeedPhrase}
                    rotating={rotating}
                    setConfirmRotate={setConfirmRotate}
                />
            ) : editName ? (
                <>
                    <div className='title disable'>
                        <Translate id='fullAccessKeys.editName.title' />
                    </div>
                    <div className='desc'>
                        <Translate id='fullAccessKeys.editName.desc' />
                    </div>
                    <div className='key font-monospace mt-4'>
                        {fullAccessKey.public_key}
                    </div>
                    <div className='desc mt-4'>
                        <Translate id='fullAccessKeys.editName.namePrompt' />
                    </div>
                    <form
                        onSubmit={(e) => {
                            publicKeyNameStorage.save(inputName);
                            setEditName(false);
                            e.preventDefault();
                        }}
                        autoComplete='off'
                    >
                        <Translate>
                            {({ translate }) => (
                                <input
                                    placeholder={translate(
                                        'fullAccessKeys.editName.name'
                                    )}
                                    value={inputName}
                                    onChange={(e) => setInputName(e.target.value)}
                                    autoComplete='off'
                                    spellCheck='false'
                                    autoFocus={true}
                                />
                            )}
                        </Translate>
                        <FormButtonGroup>
                            <FormButton
                                onClick={() => {
                                    setEditName(false);
                                }}
                                color='gray-white'
                                disabled={rotating}
                                type='button'
                            >
                                <Translate id='button.cancel' />
                            </FormButton>
                            <FormButton
                                disabled={rotating}
                                sending={rotating}
                                color='blue'
                                type='submit'
                            >
                                <Translate id='button.saveChanges' />
                            </FormButton>
                        </FormButtonGroup>
                    </form>
                </>
            ) : (
                <>
                    <div className='title'>
                        <div className='flex flex-wrap'>
                            <div>
                                {publicKeyNameStorage.load()}
                                <FontAwesomeIcon
                                    className='flex-initial text-gray-600 hover:text-gray-900 cursor-pointer ml-1'
                                    onClick={() => {
                                        setInputName(publicKeyNameStorage.load());
                                        setEditName(true);
                                    }}
                                    icon={faPen}
                                />
                            </div>
                            {fullAccessKey.meta.type === 'ledger' ? (
                                <span className='px-2 py-1 bg-blue-400 rounded-full text-xs ml-2'>
                                    <Translate id='hardwareDevices.ledger.title' />
                                </span>
                            ) : null}
                            {fullAccessKey.public_key === publicKey ? (
                                <span className='px-2 py-1 bg-green-400 rounded-full text-xs ml-2'>
                                    <Translate id='fullAccessKeys.rotateKey.inUse' />
                                </span>
                            ) : null}
                        </div>
                        {fullAccessKey.public_key === publicKey ? (
                            <FormButton
                                color='gray-blue'
                                className='small'
                                onClick={() => {
                                    setConfirmRotate(true);
                                }}
                                disabled={rotating}
                                sending={rotating}
                                sendingString='button.rotatingKey'
                            >
                                <Translate id='button.rotateKey' />
                            </FormButton>
                        ) : (
                            <FormButton
                                color='gray-red'
                                className='small'
                                onClick={() => {
                                    setConfirmDeAuthorize(true);
                                }}
                                disabled={deAuthorizing}
                                sending={deAuthorizing}
                                sendingString='button.deAuthorizing'
                            >
                                <Translate id='button.deauthorize' />
                            </FormButton>
                        )}
                    </div>
                    <div className='key font-monospace mt-4'>
                        {fullAccessKey.public_key}
                    </div>
                    {transactionHash && <hr /> && (
                        <div className='fee mt-3' style={{ fontWeight: 'bold' }}>
                            <Translate id='fullAccessKeys.transaction' />
                        </div>
                    )}
                    {transactionHash && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Link className='mt-1'>
                                <a
                                    href={`${CONFIG.EXPLORER_URL}/txns/${transactionHash}`}
                                    target='_blank'
                                    rel='noreferrer'
                                >
                                    {transactionHash.length > 15
                                        ? transactionHash
                                              .substring(0, 6)
                                              .concat(
                                                  '...',
                                                  transactionHash.substring(
                                                      transactionHash.length - 6
                                                  )
                                              )
                                        : transactionHash}
                                </a>
                            </Link>
                            <div className='text-gray-500 text-sm'>
                                <Translate id='fullAccessKeys.createdAt' />
                                &nbsp;{createdAt.toLocaleString()}
                            </div>
                        </div>
                    )}
                </>
            )}
        </Container>
    );
};

export default FullAccessKeyRotation;
