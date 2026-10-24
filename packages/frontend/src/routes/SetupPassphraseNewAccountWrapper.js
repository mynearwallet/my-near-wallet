import React, { useCallback } from 'react';
import { stringify } from 'query-string';
import { useDispatch } from 'react-redux';

import SetupPassphraseNewAccount from '../components/accounts/recovery_setup/new_account/SetupPassphraseNewAccount';
import { redirectTo } from '../redux/actions/account';
import { loadState, saveState, clearState } from '../utils/sessionStorage';
import { initiateSetupForZeroBalanceAccountPhrase } from '../redux/slices/account/createAccountThunks';

const SetupPassphraseNewAccountWrapper = () => {
    const dispatch = useDispatch();

    const handleConfirmPassphrase = useCallback(
        async ({ implicitAccountId, recoveryKeyPair }) => {
            const pendingRedirect = loadState();

            await dispatch(
                initiateSetupForZeroBalanceAccountPhrase({
                    implicitAccountId,
                    recoveryKeyPair,
                })
            );

            if (pendingRedirect && pendingRedirect.redirect_url) {
                clearState();
                saveState(pendingRedirect);
                dispatch(
                    redirectTo(
                        `${pendingRedirect.redirect_url}?${stringify(pendingRedirect)}`,
                        { globalAlertPreventClear: true }
                    )
                );
            } else {
                dispatch(redirectTo('/'));
            }
        },
        [dispatch]
    );

    return <SetupPassphraseNewAccount onConfirmPassphrase={handleConfirmPassphrase} />;
};

export default SetupPassphraseNewAccountWrapper;
