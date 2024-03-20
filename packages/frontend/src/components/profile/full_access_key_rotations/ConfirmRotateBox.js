import React from 'react';
import { Translate } from 'react-localize-redux';
import { store } from '../../..';
import { actions as ledgerActions } from '../../../redux/slices/ledger';
import Checkbox from '../../common/Checkbox';
import FormButton from '../../common/FormButton';
import FormButtonGroup from '../../common/FormButtonGroup';

const { handleShowConnectModal, checkAndHideLedgerModal } = ledgerActions;

export function ConfirmRotateBox({
    fullAccessKey,
    rotateKey,
    usingLedger,
    setUsingLedger,
    ledgerConnected,
    ledgerPath,
    setLedgerPath,
    inputSeedPhrase,
    validateInputSeedPhrase,
    inputSeedPhraseSuccess,
    inputSeedPhraseError,
    clearInputSeedPhrase,
    rotating,
    setConfirmRotate,
}) {
    return (
        <>
            <div className='title disable'>
                <Translate id='fullAccessKeys.rotateKey.title' />
            </div>
            <div className='desc'>
                <Translate id='fullAccessKeys.rotateKey.desc' />
            </div>
            <div className='key font-monospace mt-4'>{fullAccessKey.public_key}</div>
            <div className='desc mt-4'>
                <Translate id='fullAccessKeys.rotateKey.seedPhrasePrompt' />
                <span className='text-red-700'>
                    &nbsp;We're still working on making the feature compatible with Ledger
                    hardware wallets. Hang tight!
                </span>
            </div>
            <form
                onSubmit={(e) => {
                    rotateKey();
                    e.preventDefault();
                }}
                autoComplete='off'
            >
                <div className='mt-2'>
                    <label className='ml-2'>
                        <Checkbox
                            checked={usingLedger}
                            onChange={(e) => setUsingLedger(e.target.checked)}
                        />
                        <span className='ml-2'>
                            <Translate id='fullAccessKeys.usingLedger.checkbox' />
                        </span>
                    </label>
                </div>
                {usingLedger ? (
                    ledgerConnected ? (
                        <div className='flex items-center mt-2'>
                            <span className='flex-none mr-3 text-lg py-1 my-0'>
                                <Translate id='fullAccessKeys.usingLedger.hdPath' />
                            </span>
                            <input
                                type='number'
                                className='grow text-lg py-1 my-0'
                                value={ledgerPath}
                                onChange={(e) => setLedgerPath(e.target.value)}
                            />
                        </div>
                    ) : (
                        <FormButton
                            className='mt-2 w-full bg-blue-500'
                            onClick={() => {
                                store.dispatch(checkAndHideLedgerModal());
                                store.dispatch(handleShowConnectModal());
                            }}
                            disabled={rotating}
                            type='button'
                        >
                            <Translate id='fullAccessKeys.usingLedger.connect' />
                        </FormButton>
                    )
                ) : (
                    <>
                        <Translate>
                            {({ translate }) => (
                                <input
                                    placeholder={translate(
                                        'fullAccessKeys.rotateKey.seedPhrase'
                                    )}
                                    value={inputSeedPhrase}
                                    onChange={(e) =>
                                        validateInputSeedPhrase(e.target.value)
                                    }
                                    autoComplete='off'
                                    spellCheck='false'
                                    disabled={rotating}
                                    autoFocus={true}
                                />
                            )}
                        </Translate>
                        {inputSeedPhraseSuccess ? (
                            <div className='mt-2 text-green-600'>
                                <Translate id='fullAccessKeys.info.key' />
                                {inputSeedPhraseSuccess}
                            </div>
                        ) : inputSeedPhraseError ? (
                            <div className='mt-2 text-red-600'>
                                <Translate id={inputSeedPhraseError} />
                            </div>
                        ) : (
                            <></>
                        )}
                    </>
                )}
                <FormButtonGroup>
                    <FormButton
                        onClick={() => {
                            setConfirmRotate(false);
                            clearInputSeedPhrase();
                        }}
                        color='gray-white'
                        disabled={rotating}
                        type='button'
                    >
                        <Translate id='button.cancel' />
                    </FormButton>
                    <FormButton
                        disabled={
                            (!usingLedger || !ledgerConnected) &&
                            (rotating || inputSeedPhraseSuccess === '')
                        }
                        sending={rotating}
                        sendingString='button.rotatingKey'
                        color='red'
                        type='submit'
                    >
                        <Translate id='button.approve' />
                    </FormButton>
                </FormButtonGroup>
            </form>
        </>
    );
}
