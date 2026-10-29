import { createAsyncThunk } from '@reduxjs/toolkit';
import { KeyPair } from 'near-api-js';

import { SLICE_NAME } from '.';
import { trackSunsetImportNonExistentBlocked } from '../../../components/sunset/sunsetAnalytics';
import { isSunsetCapabilityEnabled } from '../../../config/sunset';
import { setLedgerHdPath } from '../../../utils/localStorage';
import {
    getImplicitAccountIdFromSeedPhrase,
    getKeyPairFromSeedPhrase,
} from '../../../utils/parseSeedPhrase';
import { wallet, setKeyMeta } from '../../../utils/wallet';
import { getLedgerPublicKey } from '../../actions/account';
import { clearGlobalAlert, showCustomAlert } from '../../actions/status';

const showImportBlocked = ({ dispatch, method }) => {
    trackSunsetImportNonExistentBlocked({ method });
    dispatch(clearGlobalAlert());
    dispatch(
        showCustomAlert({
            success: false,
            messageCodeHeader: 'error',
            messageCode: 'sunset.importBlocked.noAccount',
        })
    );
};

/**
 * Importing a key with no account on chain quietly creates a new implicit account, which the
 * sunset retires. Only a definite "does not exist" from the chain blocks the import: an existing
 * account still imports, and a failed check asks for a retry rather than claiming there is no
 * account. Either refusal comes back as `{ blocked: true }`, so callers stay on the import screen
 * with the alert instead of redirecting.
 */
const mayImportImplicitAccount = async ({ implicitAccountId, method, dispatch }) => {
    if (isSunsetCapabilityEnabled('importNonExistentAccount')) {
        return true;
    }
    let exists;
    try {
        exists = await wallet.accountExists(implicitAccountId);
    } catch (e) {
        dispatch(clearGlobalAlert());
        dispatch(
            showCustomAlert({
                success: false,
                messageCodeHeader: 'error',
                messageCode: 'sunset.importBlocked.checkFailed',
                errorMessage: e.message,
            })
        );
        return false;
    }
    if (!exists) {
        showImportBlocked({ dispatch, method });
    }
    return exists;
};

export const importZeroBalanceAccountLedger = createAsyncThunk(
    `${SLICE_NAME}/importZeroBalanceAccountLedger`,
    async (ledgerHdPath, { dispatch }) => {
        try {
            const ledgerPublicKey = await dispatch(getLedgerPublicKey(ledgerHdPath));
            const implicitAccountId = Buffer.from(ledgerPublicKey.data).toString('hex');
            const account = wallet.getAccountBasic(implicitAccountId);
            try {
                const accountState = await account.state();
                if (accountState) {
                    const errorMessage = `Implicit account ID ${implicitAccountId} derived from Ledger HD path ${ledgerHdPath} already exists but is not controlled by this Ledger device.`;
                    // This could happen if user creates an implicit account with Ledger but then switches to seed phrase recovery, etc.
                    console.log(errorMessage);
                    dispatch(
                        showCustomAlert({
                            errorMessage: errorMessage,
                            success: false,
                            messageCodeHeader: 'error',
                        })
                    );
                    return;
                }
            } catch (e) {
                if (e.message.includes('does not exist while viewing')) {
                    if (!isSunsetCapabilityEnabled('importNonExistentAccount')) {
                        showImportBlocked({ dispatch, method: 'ledger' });
                        return { imported: false, blocked: true };
                    }
                    console.log(
                        'Ledger implicit Account ID does not exist on chain. Importing as zero balance account.'
                    );
                    await setKeyMeta(ledgerPublicKey, { type: 'ledger' });
                    await setLedgerHdPath({
                        accountId: implicitAccountId,
                        path: ledgerHdPath,
                    });
                    await wallet.importZeroBalanceAccount(implicitAccountId);
                    return { imported: true };
                } else {
                    throw e;
                }
            }
        } catch (e) {
            dispatch(
                showCustomAlert({
                    errorMessage: e.message,
                    success: false,
                    messageCodeHeader: 'error',
                })
            );
        }
        return { imported: false };
    }
);

export const importZeroBalanceAccountPhrase = createAsyncThunk(
    `${SLICE_NAME}/importZeroBalanceAccountPhrase`,
    async (seedPhrase, { dispatch }) => {
        const recoveryKeyPair = getKeyPairFromSeedPhrase(seedPhrase);
        const implicitAccountId = getImplicitAccountIdFromSeedPhrase(seedPhrase);
        if (
            !(await mayImportImplicitAccount({
                implicitAccountId,
                method: 'phrase',
                dispatch,
            }))
        ) {
            return { imported: false, blocked: true };
        }
        try {
            await wallet.importZeroBalanceAccount(implicitAccountId, recoveryKeyPair);
            return { imported: true };
        } catch (e) {
            dispatch(
                showCustomAlert({
                    success: false,
                    messageCodeHeader: 'error',
                    messageCode:
                        'walletErrorCodes.recoverAccountSeedPhrase.errorNotAbleToImportAccount',
                    errorMessage: e.message,
                })
            );
            return { imported: false };
        }
    }
);

export const importZeroBalanceAccountPrivateKey = createAsyncThunk(
    `${SLICE_NAME}/importZeroBalanceAccountPrivateKey`,
    async (secretKey, { dispatch }) => {
        const recoveryKeyPair = KeyPair.fromString(secretKey);
        const implicitAccountId = Buffer.from(recoveryKeyPair.publicKey.data).toString(
            'hex'
        );
        if (
            !(await mayImportImplicitAccount({
                implicitAccountId,
                method: 'private_key',
                dispatch,
            }))
        ) {
            return { imported: false, blocked: true };
        }
        try {
            await wallet.importZeroBalanceAccount(implicitAccountId, recoveryKeyPair);
            return { imported: true };
        } catch (e) {
            dispatch(
                showCustomAlert({
                    success: false,
                    messageCodeHeader: 'error',
                    messageCode:
                        'walletErrorCodes.recoverAccountSeedPhrase.errorNotAbleToImportAccount',
                    errorMessage: e.message,
                })
            );
            return { imported: false };
        }
    }
);
