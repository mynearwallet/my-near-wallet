import { createAsyncThunk } from '@reduxjs/toolkit';
import { KeyPair } from 'near-api-js';

import { SLICE_NAME } from '.';
import { trackSunsetImportNonExistentBlocked } from '../../../components/sunset/sunsetAnalytics';
import { isSunsetCapabilityEnabled } from '../../../config/sunset';
import { confirmNoAccountIdsForPublicKey } from '../../../utils/helper-api';
import { setLedgerHdPath } from '../../../utils/localStorage';
import {
    getImplicitAccountIdFromSeedPhrase,
    getKeyPairFromSeedPhrase,
} from '../../../utils/parseSeedPhrase';
import { wallet, setKeyMeta } from '../../../utils/wallet';
import { getLedgerPublicKey } from '../../actions/account';
import { clearGlobalAlert, showCustomAlert } from '../../actions/status';

const showImportCheckFailed = ({ dispatch, errorMessage }) => {
    dispatch(clearGlobalAlert());
    dispatch(
        showCustomAlert({
            success: false,
            messageCodeHeader: 'error',
            messageCode: 'sunset.importBlocked.checkFailed',
            errorMessage,
        })
    );
};

/**
 * Says "no account" only once the indexers confirm it. Recovery reaches the implicit account when
 * the indexer lookup comes back empty, and it comes back empty when every indexer is down too:
 * a named account behind this key would then be told it does not exist.
 */
const showImportBlocked = async ({ dispatch, method, publicKey }) => {
    let confirmed = false;
    try {
        confirmed = await confirmNoAccountIdsForPublicKey(publicKey);
    } catch {
        confirmed = false;
    }
    if (!confirmed) {
        showImportCheckFailed({ dispatch, errorMessage: 'Account lookup unavailable' });
        return;
    }
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
 * sunset retires. Only a definite "does not exist" from the chain, confirmed by the indexers,
 * blocks the import: an existing account still imports, and a failed check asks for a retry
 * rather than claiming there is no account. Either refusal comes back as `{ blocked: true }`, so
 * callers stay on the import screen with the alert instead of redirecting.
 */
const mayImportImplicitAccount = async ({
    implicitAccountId,
    publicKey,
    method,
    dispatch,
}) => {
    if (isSunsetCapabilityEnabled('importNonExistentAccount')) {
        return true;
    }
    let exists;
    try {
        exists = await wallet.accountExists(implicitAccountId);
    } catch (e) {
        showImportCheckFailed({ dispatch, errorMessage: e.message });
        return false;
    }
    if (!exists) {
        await showImportBlocked({ dispatch, method, publicKey });
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
                        await showImportBlocked({
                            dispatch,
                            method: 'ledger',
                            publicKey: ledgerPublicKey.toString(),
                        });
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
                publicKey: recoveryKeyPair.getPublicKey().toString(),
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
                publicKey: recoveryKeyPair.getPublicKey().toString(),
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
