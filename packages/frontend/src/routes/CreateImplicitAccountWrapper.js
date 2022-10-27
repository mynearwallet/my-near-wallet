import BN from 'bn.js';
import { getLocation } from 'connected-react-router';
import { utils } from 'near-api-js';
import { formatNearAmount } from 'near-api-js/lib/utils/format';
import { parse } from 'query-string';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import CreateImplicitAccount from '../components/accounts/create/implicit_account/CreateImplicitAccount';
import CONFIG from '../config';
import { Mixpanel } from '../mixpanel';
import { redirectTo } from '../redux/actions/account';
import { showCustomAlert } from '../redux/actions/status';
import { selectAccountId } from '../redux/slices/account';
import { finishSetupImplicitAccount } from '../redux/slices/account/createAccountThunks';
import { actions as createFromImplicitActions } from '../redux/slices/createFromImplicit';
import { actions as ledgerActions } from '../redux/slices/ledger';
import { getSignedUrl, isMoonpayAvailable } from '../utils/moonpay';
import useRecursiveTimeout from '../utils/useRecursiveTimeout';
import { wallet } from '../utils/wallet';

const { setCreateCustomName } = createFromImplicitActions;
const { checkAndHideLedgerModal } = ledgerActions;

// Check that the initial deposit was at least 0.17N, otherwise the users 'available balance'
// won't be enough to create a named account.
const NAMED_ACCOUNT_MIN = utils.format.parseNearAmount('0.17');

const CreateImplicitAccountWrapper = () => {
    const dispatch = useDispatch();

    const accountId = useSelector(selectAccountId);

    const [fundingNeeded, setFundingNeeded] = useState(true);
    const [moonpaySignedUrl, setMoonpaySignedUrl] = useState(null);

    const location = useSelector(getLocation);
    const URLParams = parse(location.search);
    const implicitAccountId = URLParams.implicitAccountId;
    const recoveryMethod = URLParams.recoveryMethod;

    const formattedMinDeposit = formatNearAmount(CONFIG.MIN_BALANCE_TO_CREATE);

    useEffect(() => {
        if (accountId === implicitAccountId || !implicitAccountId || !recoveryMethod) {
            dispatch(redirectTo('/'));
        }
    }, [accountId, implicitAccountId, recoveryMethod]);

    useEffect(() => {
        const checkIfMoonPayIsAvailable = async () => {
            await Mixpanel.withTracking('CA Check Moonpay available',
                async () => {
                    const moonpayAvailable = await isMoonpayAvailable();
                    if (moonpayAvailable) {
                        const moonpaySignedUrl = await getSignedUrl(implicitAccountId, window.location.href);
                        setMoonpaySignedUrl(moonpaySignedUrl);
                    }
                }
            );
        };
        checkIfMoonPayIsAvailable();
    }, [
        implicitAccountId,
        window.location.href
    ]);

    useRecursiveTimeout(async () => {
        await checkFundingAddressBalance().catch(() => { });
    }, 3000);

    const checkFundingAddressBalance = async () => {
        if (fundingNeeded) {
            await Mixpanel.withTracking('CA Check balance from implicit',
                async () => {
                    try {
                        const account = wallet.getAccountBasic(implicitAccountId);
                        const state = await account.state();
                        if (new BN(state.amount).gte(new BN(CONFIG.MIN_BALANCE_TO_CREATE))) {
                            Mixpanel.track('CA Check balance from implicit: sufficient');
                            setFundingNeeded(false);
                            console.log('Minimum funding amount received. Finishing acccount setup.');
                            await dispatch(finishSetupImplicitAccount({
                                implicitAccountId,
                                recoveryMethod
                            })).unwrap();
                            if (new BN(state.amount).gte(new BN(NAMED_ACCOUNT_MIN))) {
                                dispatch(setCreateCustomName(true));
                            }
                            return;
                        } else {
                            console.log('Insufficient funding amount');
                            Mixpanel.track('CA Check balance from implicit: insufficient');
                        }
                    } catch (e) {
                        if (e.message.includes('does not exist while viewing')) {
                            return;
                        }
                        dispatch(showCustomAlert({
                            errorMessage: e.message,
                            success: false,
                            messageCodeHeader: 'error'
                        }));
                        throw e;
                    } finally {
                        if (recoveryMethod === 'ledger') {
                            dispatch(checkAndHideLedgerModal());
                        }
                    }
                }
            );
        }
    };

    return (
        <CreateImplicitAccount
            formattedMinDeposit={formattedMinDeposit}
            implicitAccountId={implicitAccountId}
            moonpayIsAvailable={moonpaySignedUrl}
            moonpaySignedUrl={moonpaySignedUrl}
        />
    );
};

export default CreateImplicitAccountWrapper;
