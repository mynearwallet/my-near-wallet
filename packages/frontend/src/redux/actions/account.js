import { CalimeroWalletUtils } from 'calimero-wallet-utils';
import { getLocation, push } from 'connected-react-router';
import { parse, stringify } from 'query-string';
import { createActions, createAction } from 'redux-actions';

import {
    handleStakingUpdateAccount,
    handleStakingUpdateLockup,
    handleGetLockup,
} from './staking';
import { showCustomAlert } from './status';
import CONFIG from '../../config';
import { actions as activeAccountActions } from '../../redux/slices/activeAccount';
import { showAlert } from '../../utils/alerts';
import { isUrlNotJavascriptProtocol } from '../../utils/helper-api';
import { loadState, saveState, clearState } from '../../utils/sessionStorage';
import { TwoFactor } from '../../utils/twoFactor';
import Wallet, {
    wallet,
    WALLET_CREATE_NEW_ACCOUNT_URL,
    WALLET_CREATE_NEW_ACCOUNT_FLOW_URLS,
    WALLET_INITIAL_DEPOSIT_URL,
    WALLET_LOGIN_URL,
    WALLET_SIGN_URL,
    WALLET_RECOVER_ACCOUNT_URL,
    WALLET_LINKDROP_URL,
    setKeyMeta,
    ENABLE_IDENTITY_VERIFIED_ACCOUNT,
    WALLET_BATCH_IMPORT_URL,
    WALLET_VERIFY_OWNER_URL,
    WALLET_SIGN_MESSAGE_URL,
} from '../../utils/wallet';
import { WalletError } from '../../utils/walletError';
import { withAlert } from '../reducers/status';
import refreshAccountOwner from '../sharedThunks/refreshAccountOwner';
import {
    selectAccountAccountsBalances,
    selectAccountHasLockup,
    selectAccountId,
    selectAccountUrl,
    selectAccountUrlCallbackUrl,
    selectAccountUrlContractId,
    selectAccountUrlFailureUrl,
    selectAccountUrlMeta,
    selectAccountUrlMethodNames,
    selectAccountUrlPublicKey,
    selectAccountUrlPrivateShard,
    selectAccountUrlRedirectUrl,
    selectAccountUrlSuccessUrl,
    selectAccountUrlTitle,
    selectAccountUrlTransactions,
} from '../slices/account';
import { createAccountWithSeedPhrase } from '../slices/account/createAccountThunks';
import { selectAllAccountsHasLockup } from '../slices/allAccounts';
import { selectAvailableAccounts } from '../slices/availableAccounts';
import {
    actions as flowLimitationActions,
    selectFlowLimitationAccountBalance,
    selectFlowLimitationAccountData,
} from '../slices/flowLimitation';
import convertUrlToSendMessage from '../../utils/convertUrlToSendMessage';

const { handleFlowLimitation, handleClearflowLimitation } = flowLimitationActions;

export const getProfileStakingDetails =
    (externalAccountId) => async (dispatch, getState) => {
        await dispatch(handleGetLockup(externalAccountId));

        await dispatch(handleStakingUpdateAccount([], externalAccountId));

        const lockupIdExists = externalAccountId
            ? selectAllAccountsHasLockup(getState(), { accountId: externalAccountId })
            : selectAccountHasLockup(getState());

        lockupIdExists && dispatch(handleStakingUpdateLockup(externalAccountId));
    };

export const handleRedirectUrl = (previousLocation) => (dispatch, getState) => {
    const { pathname } = getLocation(getState());
    const isValidRedirectUrl =
        previousLocation.pathname.includes(WALLET_LOGIN_URL) ||
        previousLocation.pathname.includes(WALLET_SIGN_URL);
    const page = pathname.split('/')[1];
    const guestLandingPage = !page && !wallet.accountId;
    const createAccountPage = page === WALLET_CREATE_NEW_ACCOUNT_URL;
    const recoverAccountPage = page === WALLET_RECOVER_ACCOUNT_URL;

    if (
        (guestLandingPage || createAccountPage || recoverAccountPage) &&
        isValidRedirectUrl
    ) {
        let url = {
            ...selectAccountUrl(getState()),
            redirect_url: previousLocation.pathname,
        };
        saveState(url);
        dispatch(refreshUrl(url));
    }
};

export const handleClearUrl = () => (dispatch, getState) => {
    const { pathname } = getLocation(getState());
    const page = pathname.split('/')[1];
    const guestLandingPage = !page && !wallet.accountId;
    const saveUrlPages = [
        ...WALLET_CREATE_NEW_ACCOUNT_FLOW_URLS,
        WALLET_LOGIN_URL,
        WALLET_SIGN_URL,
        WALLET_LINKDROP_URL,
    ].includes(page);
    const initialDepositPage = WALLET_INITIAL_DEPOSIT_URL.includes(page);

    if (!guestLandingPage && !saveUrlPages) {
        clearState();
        dispatch(refreshUrl({}));
        dispatch(handleClearflowLimitation());
    } else if (!initialDepositPage) {
        dispatch(handleClearflowLimitation());
    }
};

export const parseTransactionsToSign = createAction('PARSE_TRANSACTIONS_TO_SIGN');

export const handleRefreshUrl = (prevRouter) => (dispatch, getState) => {
    const { pathname, search, hash } = prevRouter?.location || getLocation(getState());
    const currentPage = pathname.split('/')[pathname[1] === '/' ? 2 : 1];

    if (
        [
            ...WALLET_CREATE_NEW_ACCOUNT_FLOW_URLS,
            WALLET_LOGIN_URL,
            WALLET_SIGN_URL,
            WALLET_LINKDROP_URL,
            WALLET_BATCH_IMPORT_URL,
            WALLET_VERIFY_OWNER_URL,
            WALLET_SIGN_MESSAGE_URL,
        ].includes(currentPage)
    ) {
        let parsedUrl = {
            ...parse(search),
            referrer: document.referrer ? new URL(document.referrer).hostname : undefined,
            redirect_url: prevRouter ? prevRouter.location.pathname : undefined,
        };
        const parsedFragment = parse(hash);
        const isPrivateShard = parsedFragment?.calimeroShardId;
        if (parsedFragment.calimeroShardId) {
            parsedUrl = { ...parsedUrl, ...parsedFragment };
        }
        if (
            [
                WALLET_CREATE_NEW_ACCOUNT_URL,
                WALLET_LINKDROP_URL,
                WALLET_VERIFY_OWNER_URL,
                WALLET_SIGN_MESSAGE_URL,
            ].includes(currentPage) &&
            search !== ''
        ) {
            saveState(parsedUrl);
            dispatch(refreshUrl(parsedUrl));
        } else if (
            [WALLET_LOGIN_URL, WALLET_SIGN_URL, WALLET_BATCH_IMPORT_URL].includes(
                currentPage
            ) &&
            (search !== '' || hash !== '')
        ) {
            saveState(parsedUrl);
            dispatch(refreshUrl(parsedUrl));
            dispatch(checkContractId(isPrivateShard));
        } else {
            dispatch(refreshUrl(loadState()));
        }
        dispatch(handleFlowLimitation());

        const transactions = selectAccountUrlTransactions(getState());
        const callbackUrl = selectAccountUrlCallbackUrl(getState());
        const meta = selectAccountUrlMeta(getState());

        if (transactions) {
            dispatch(parseTransactionsToSign({ transactions, callbackUrl, meta }));
        }
    }
};

const checkContractId = () => async (dispatch, getState) => {
    const contractId = selectAccountUrlContractId(getState());
    const failureUrl = selectAccountUrlFailureUrl(getState());
    const shardInfo = selectAccountUrlPrivateShard(getState());

    if (contractId) {
        const redirectIncorrectContractId = () => {
            console.error('Invalid contractId:', contractId);
            dispatch(
                redirectTo(
                    `/${WALLET_LOGIN_URL}/?invalidContractId=true&failure_url=${failureUrl}`,
                    { globalAlertPreventClear: true }
                )
            );
        };

        if (!wallet.isLegitAccountId(contractId)) {
            redirectIncorrectContractId();
            return;
        }

        try {
            if (shardInfo) {
                const shardInfoWithAuth = {
                    ...shardInfo,
                    xSignature: await wallet.generatePrivateShardXSignature(shardInfo),
                };
                const privateShardWallet = new Wallet(shardInfoWithAuth);
                await privateShardWallet.getAccountBasic(contractId).state();
            } else {
                await wallet.getAccountBasic(contractId).state();
            }
        } catch (error) {
            if (error.message.indexOf('does not exist while viewing') !== -1) {
                redirectIncorrectContractId();
            }
        }
    }
};

export const redirectTo =
    (location, state = {}) =>
    (dispatch) => {
        const [pathname, search] = location.split('?');
        dispatch(
            push({
                pathname,
                search,
                state,
            })
        );
    };

export const redirectToApp = (fallback) => async (dispatch, getState) => {
    dispatch(handleRefreshUrl());
    const url = selectAccountUrl(getState());
    dispatch(
        push({
            pathname:
                (url && url.redirect_url !== '/' && url.redirect_url) || fallback || '/',
            search:
                url && (url.success_url || url.public_key) ? `?${stringify(url)}` : '',
            state: {
                globalAlertPreventClear: true,
            },
        })
    );
};

export const allowLogin = () => async (dispatch, getState) => {
    try {
        dispatch(activeAccountActions.setLoginError({ isError: false }));
        const contractId = selectAccountUrlContractId(getState());
        const publicKey = selectAccountUrlPublicKey(getState());
        const methodNames = selectAccountUrlMethodNames(getState());
        const title = selectAccountUrlTitle(getState());
        const successUrl = selectAccountUrlSuccessUrl(getState());

        const shardInfo = selectAccountUrlPrivateShard(getState());

        if (shardInfo) {
            const calimeroConfig = {
                shardId: shardInfo.shardId,
                calimeroUrl: CONFIG.CALIMERO_URL,
                rpcEndpoint: shardInfo.shardRpc,
                walletNetworkId: CONFIG.NETWORK_ID,
            };

            const calimeroWalletUtils = CalimeroWalletUtils.init(calimeroConfig);
            const xSignature = await wallet.generatePrivateShardXSignature(shardInfo);

            await calimeroWalletUtils.syncAccount(wallet.accountId, xSignature);
        }

        const addAccessKeyAction = shardInfo ? addShardAccessKey : addAccessKey;
        const shardInfoWithAuth = shardInfo
            ? {
                  ...shardInfo,
                  xSignature: await wallet.generatePrivateShardXSignature(shardInfo),
              }
            : shardInfo;

        if (successUrl) {
            if (publicKey) {
                await dispatch(
                    withAlert(
                        addAccessKeyAction(
                            wallet.accountId,
                            contractId,
                            publicKey,
                            false,
                            methodNames,
                            shardInfoWithAuth
                        ),
                        { onlyError: true }
                    )
                );
            }
            const availableKeys = await wallet.getAvailableKeys();

            const allKeys = availableKeys.map((key) => key.toString());

            if (window.opener) {
                console.log('triggered window.opener');
                return window.opener.postMessage(
                    {
                        status: 'success',
                        account_id: wallet.accountId,
                        public_key: publicKey,
                        all_keys: allKeys,
                    },
                    convertUrlToSendMessage(successUrl)
                );
            }
            const parsedUrl = new URL(successUrl);
            parsedUrl.searchParams.set('account_id', wallet.accountId);
            if (publicKey) {
                parsedUrl.searchParams.set('public_key', publicKey);
            }
            parsedUrl.searchParams.set('all_keys', allKeys.join(','));
            if (isUrlNotJavascriptProtocol(parsedUrl.href)) {
                window.location = parsedUrl.href;
            } else {
                dispatch(
                    showCustomAlert({
                        success: false,
                        messageCodeHeader: 'error',
                        errorMessage:
                            'Redirect blocked: The URL contains javascript and cannot be processed',
                    })
                );
            }
        } else {
            await dispatch(
                withAlert(
                    addAccessKeyAction(
                        wallet.accountId,
                        contractId,
                        publicKey,
                        false,
                        methodNames,
                        shardInfoWithAuth
                    ),
                    { data: { title } }
                )
            );
            dispatch(redirectTo('/authorized-apps', { globalAlertPreventClear: true }));
        }
    } catch (err) {
        dispatch(activeAccountActions.setLoginError({ isError: true }));
        dispatch(
            showCustomAlert({
                success: false,
                messageCodeHeader: 'error',
                errorMessage: err.message,
            })
        );
    }
};

const twoFactorMethod = async (method, wallet, args) => {
    const account = await wallet.getAccount(wallet.accountId);
    if (account[method]) {
        return await account[method](...args);
    }
    return false;
};

export const {
    initializeRecoveryMethod,
    validateSecurityCode,
    initTwoFactor,
    reInitTwoFactor,
    resendTwoFactor,
    verifyTwoFactor,
    promptTwoFactor,
    deployMultisig,
    disableMultisig,
    checkCanEnableTwoFactor,
    get2faMethod,
    getLedgerKey,
    getLedgerPublicKey,
    setupRecoveryMessage,
    deleteRecoveryMethod,
    checkLinkdropInfo,
    claimLinkdropToAccount,
    checkIsNew,
    checkNewAccount,
    saveAccount,
    checkAccountAvailable,
    clearCode,
    getMultisigRequest,
} = createActions({
    INITIALIZE_RECOVERY_METHOD: [
        (...args) => wallet.initializeRecoveryMethod(...args),
        () => ({}),
    ],
    VALIDATE_SECURITY_CODE: [
        (...args) => wallet.validateSecurityCode(...args),
        () => ({}),
    ],
    INIT_TWO_FACTOR: [
        (...args) => new TwoFactor(wallet, wallet.accountId).initTwoFactor(...args),
        () => showAlert({ onlyError: true }),
    ],
    REINIT_TWO_FACTOR: [
        (...args) => new TwoFactor(wallet, wallet.accountId).initTwoFactor(...args),
        () => ({}),
    ],
    RESEND_TWO_FACTOR: [() => twoFactorMethod('sendCode', wallet, []), () => ({})],
    VERIFY_TWO_FACTOR: [
        (...args) => new TwoFactor(wallet, wallet.accountId).verifyCodeDefault(...args),
        () => showAlert(),
    ],
    PROMPT_TWO_FACTOR: [
        (requestPending) => {
            let promise;
            if (requestPending !== null) {
                promise = new Promise((resolve, reject) => {
                    requestPending = (verified, error) => {
                        if (verified) {
                            resolve(verified);
                        } else {
                            reject(error);
                        }
                    };
                });
            }
            return { requestPending, promise };
        },
        () => ({}),
    ],
    DEPLOY_MULTISIG: [
        () => new TwoFactor(wallet, wallet.accountId).deployMultisig(),
        () => showAlert(),
    ],
    DISABLE_MULTISIG: [
        (...args) => twoFactorMethod('disableMultisig', wallet, args),
        () => showAlert(),
    ],
    CHECK_CAN_ENABLE_TWO_FACTOR: [
        (...args) => TwoFactor.checkCanEnableTwoFactor(...args),
        () => ({}),
    ],
    GET_2FA_METHOD: [
        (...args) => twoFactorMethod('get2faMethod', wallet, args),
        () => ({}),
    ],
    GET_MULTISIG_REQUEST: [
        () => new TwoFactor(wallet, wallet.accountId).getMultisigRequest(),
        () => ({}),
    ],
    GET_LEDGER_KEY: [(...args) => wallet.getLedgerKey(...args), () => ({})],
    GET_LEDGER_PUBLIC_KEY: [(...args) => wallet.getLedgerPublicKey(...args), () => ({})],
    SETUP_RECOVERY_MESSAGE: [
        (...args) => wallet.setupRecoveryMessage(...args),
        () => showAlert(),
    ],
    DELETE_RECOVERY_METHOD: [
        (...args) => wallet.deleteRecoveryMethod(...args),
        () => showAlert(),
    ],
    CHECK_LINKDROP_INFO: [(...args) => wallet.checkLinkdropInfo(...args), () => ({})],
    CLAIM_LINKDROP_TO_ACCOUNT: [
        (...args) => wallet.claimLinkdropToAccount(...args),
        () => showAlert({ onlyError: true }),
    ],
    CHECK_IS_NEW: [
        (...args) => wallet.checkIsNew(...args),
        () => showAlert({ localAlert: true }),
    ],
    CHECK_NEW_ACCOUNT: [
        (...args) => wallet.checkNewAccount(...args),
        () => showAlert({ localAlert: true }),
    ],
    SAVE_ACCOUNT: (...args) => wallet.saveAccount(...args),
    CHECK_ACCOUNT_AVAILABLE: [
        (...args) => wallet.checkAccountAvailable(...args),
        () => showAlert({ localAlert: true }),
    ],
    CLEAR_CODE: null,
});

export const {
    getAccessKeys,
    removeAccessKey,
    addLedgerAccessKey,
    sendIdentityVerificationMethodCode,
    disableLedger,
    removeNonLedgerAccessKeys,
} = createActions({
    GET_ACCESS_KEYS: [(...args) => wallet.getAccessKeys(...args), () => ({})],
    REMOVE_ACCESS_KEY: [
        (...args) => wallet.removeAccessKey(...args),
        () => showAlert({ onlyError: true }),
    ],
    ADD_LEDGER_ACCESS_KEY: [
        (...args) => wallet.addLedgerAccessKey(...args),
        () => showAlert({ onlyError: true }),
    ],
    SEND_IDENTITY_VERIFICATION_METHOD_CODE: [
        (...args) => wallet.sendIdentityVerificationMethodCode(...args),
        () => showAlert({ localAlert: true }),
    ],
    DISABLE_LEDGER: [(...args) => wallet.disableLedger(...args), () => ({})],
    REMOVE_NON_LEDGER_ACCESS_KEYS: [
        (...args) => wallet.removeNonLedgerAccessKeys(...args),
        () => ({}),
    ],
});

export const handleAddAccessKeySeedPhrase =
    (accountId, recoveryKeyPair) => async (dispatch) => {
        try {
            await dispatch(addAccessKeySeedPhrase(accountId, recoveryKeyPair));
        } catch (error) {
            // error is thrown in `addAccessKeySeedPhrase` action, despite the error, we still want to redirect to /profile
        }
        dispatch(
            redirectTo('/profile', {
                globalAlertPreventClear: true,
            })
        );
    };

const handleFundCreateAccountRedirect =
    ({ accountId, implicitAccountId, recoveryMethod }) =>
    (dispatch, getState) => {
        const activeAccountId = selectAccountId(getState());

        if (ENABLE_IDENTITY_VERIFIED_ACCOUNT) {
            const route = activeAccountId
                ? '/fund-with-existing-account'
                : '/verify-account';
            const search = `?accountId=${accountId}&implicitAccountId=${implicitAccountId}&recoveryMethod=${recoveryMethod}`;
            dispatch(redirectTo(route + search));
        } else {
            dispatch(
                redirectTo(
                    `/fund-create-account/${accountId}/${implicitAccountId}/${recoveryMethod}`
                )
            );
        }
    };

export const fundCreateAccount =
    (accountId, recoveryKeyPair, recoveryMethod) => async (dispatch) => {
        await wallet.keyStore.setKey(
            wallet.connection.networkId,
            accountId,
            recoveryKeyPair
        );
        const implicitAccountId = Buffer.from(recoveryKeyPair.publicKey.data).toString(
            'hex'
        );
        await wallet.keyStore.setKey(
            wallet.connection.networkId,
            implicitAccountId,
            recoveryKeyPair
        );

        dispatch(
            handleFundCreateAccountRedirect({
                accountId,
                implicitAccountId,
                recoveryMethod,
            })
        );
    };

export const fundCreateAccountLedger =
    (accountId, ledgerPublicKey) => async (dispatch) => {
        await setKeyMeta(ledgerPublicKey, { type: 'ledger' });
        const implicitAccountId = Buffer.from(ledgerPublicKey.data).toString('hex');
        const recoveryMethod = 'ledger';

        dispatch(
            handleFundCreateAccountRedirect({
                accountId,
                implicitAccountId,
                recoveryMethod,
            })
        );
    };

// TODO: Refactor common code with setupRecoveryMessageNewAccount
export const handleCreateAccountWithSeedPhrase =
    (accountId, recoveryKeyPair, fundingOptions, recaptchaToken) => async (dispatch) => {
        // Coin-op verify account flow
        if (
            CONFIG.DISABLE_CREATE_ACCOUNT &&
            ENABLE_IDENTITY_VERIFIED_ACCOUNT &&
            !fundingOptions
        ) {
            await dispatch(fundCreateAccount(accountId, recoveryKeyPair, 'phrase'));
            return;
        }

        // Implicit account flow
        if (CONFIG.DISABLE_CREATE_ACCOUNT && !fundingOptions && !recaptchaToken) {
            await dispatch(fundCreateAccount(accountId, recoveryKeyPair, 'phrase'));
            return;
        }

        try {
            await dispatch(
                createAccountWithSeedPhrase({
                    accountId,
                    recoveryKeyPair,
                    fundingOptions,
                    recaptchaToken,
                })
            ).unwrap();
        } catch (error) {
            console.log('error in handle create account with seedphrase: ', error);
            if (await wallet.accountExists(accountId)) {
                // Requests sometimes fail after creating the NEAR account for another reason (transport error?)
                // If that happened, we allow the user can add the NEAR account to the wallet by entering the seed phrase
                dispatch(
                    redirectTo('/recover-seed-phrase', {
                        globalAlertPreventClear: true,
                        defaultAccountId: accountId,
                    })
                );
                return;
            }
            throw error;
        }
    };

export const finishAccountSetup = () => async (dispatch, getState) => {
    await dispatch(refreshAccount());
    await dispatch(clearAccountState());

    const redirectUrl = selectAccountUrlRedirectUrl(getState());
    const accountId = selectAccountId(getState());

    if (redirectUrl) {
        if (isUrlNotJavascriptProtocol(redirectUrl)) {
            window.location = `${redirectUrl}?accountId=${accountId}`;
        } else {
            dispatch(handleRefreshUrl());
            dispatch(
                push({
                    pathname: '/',
                    search: '',
                    state: {
                        globalAlertPreventClear: true,
                    },
                })
            );
            dispatch(
                showCustomAlert({
                    success: false,
                    messageCodeHeader: 'error',
                    messageCode: 'linkdropLanding.error.invalidRedirectUrl',
                    errorMessage: redirectUrl,
                })
            );
        }
    } else {
        dispatch(redirectToApp('/'));
    }
};

export const { addAccessKey, addAccessKeySeedPhrase, addShardAccessKey } = createActions({
    ADD_ACCESS_KEY: [
        (...args) => wallet.addAccessKey(...args),
        (title) => showAlert({ title }),
    ],
    ADD_ACCESS_KEY_SEED_PHRASE: [
        async (accountId, recoveryKeyPair) => {
            const publicKey = recoveryKeyPair.publicKey.toString();
            const contractName = null;
            const fullAccess = true;

            try {
                await wallet.postSignedJson('/account/seedPhraseAdded', {
                    accountId,
                    publicKey,
                });
                await wallet.addAccessKey(accountId, contractName, publicKey, fullAccess);
            } catch (error) {
                throw new WalletError(error, 'addAccessKeySeedPhrase.errorSecond');
            }
        },
        () => showAlert(),
    ],
    ADD_SHARD_ACCESS_KEY: [
        async (
            accountId,
            contractId,
            publicKey,
            fullAccess = false,
            methodNames = '',
            shardInfoWithAuth
        ) => {
            try {
                await new Wallet(shardInfoWithAuth).addAccessKey(
                    accountId,
                    contractId,
                    publicKey,
                    fullAccess,
                    methodNames
                );
            } catch (error) {
                throw new WalletError(
                    error,
                    'addAccessKeyToPrivateShard.errorPrivateShard'
                );
            }
        },
        (title) => showAlert({ title }),
    ],
});

export const { recoverAccountSeedPhrase } = createActions({
    RECOVER_ACCOUNT_SEED_PHRASE: [
        (...args) => wallet.recoverAccountSeedPhrase(...args),
        () => {},
    ],
});

export const { recoverAccountSecretKey } = createActions({
    RECOVER_ACCOUNT_SECRET_KEY: [
        (...args) => wallet.recoverAccountSecretKey(...args),
        () => showAlert(),
    ],
});

export const { sendMoney, transferAllFromLockup } = createActions({
    SEND_MONEY: [
        (...args) => wallet.sendMoney(...args),
        () => showAlert({ onlyError: true }),
    ],
    TRANSFER_ALL_FROM_LOCKUP: [
        async () => {
            const account = await wallet.getAccount(wallet.accountId);
            if (account.transferAllFromLockup) {
                await account.transferAllFromLockup();
            }
        },
        () => showAlert(),
    ],
});

export const refreshAccount =
    (basicData = false) =>
    async (dispatch, getState) => {
        if (!wallet.accountId) {
            return;
        }

        dispatch(setLocalStorage(wallet.accountId));
        dispatch(activeAccountActions.setAccountId({ accountId: wallet.accountId }));
        await dispatch(
            refreshAccountOwner(selectFlowLimitationAccountData(getState()))
        ).unwrap();

        if (!basicData && !selectFlowLimitationAccountBalance(getState())) {
            dispatch(getBalance('', selectFlowLimitationAccountData(getState())));
        }
    };

export const switchAccount =
    ({ accountId }) =>
    async (dispatch) => {
        dispatch(makeAccountActive(accountId));
        dispatch(handleRefreshUrl());
        dispatch(refreshAccount());
        dispatch(clearAccountState());
    };

export const getAvailableAccountsBalance = () => async (dispatch, getState) => {
    let accountsBalance = selectAccountAccountsBalances(getState());
    const availableAccounts = selectAvailableAccounts(getState());

    if (selectFlowLimitationAccountData(getState())) {
        return;
    }

    for (let i = 0; i < availableAccounts.length; i++) {
        const accountId = availableAccounts[i];
        if (!accountsBalance[accountId]) {
            i < 0 && (await dispatch(setAccountBalance(accountId)));
        }
    }

    accountsBalance = selectAccountAccountsBalances(getState());

    for (let i = 0; i < Object.keys(accountsBalance).length; i++) {
        const accountId = Object.keys(accountsBalance)[i];
        if (accountsBalance[accountId].loading) {
            await dispatch(getAccountBalance(accountId));
        }
    }
};

export const {
    makeAccountActive,
    refreshAccountExternal,
    refreshUrl,
    updateStakingAccount,
    updateStakingLockup,
    getBalance,
    setLocalStorage,
    getAccountBalance,
    setAccountBalance,
    clearAccountState,
} = createActions({
    MAKE_ACCOUNT_ACTIVE: (...args) => wallet.makeAccountActive(...args),
    REFRESH_ACCOUNT_EXTERNAL: [
        async (accountId) => ({
            ...(await (await wallet.getAccount(accountId)).state()),
            balance: {
                ...(await wallet.getBalance(accountId)),
            },
        }),
        (accountId) => ({
            accountId,
        }),
    ],
    REFRESH_URL: null,
    UPDATE_STAKING_ACCOUNT: [
        async (accountId) => await wallet.staking.updateStakingAccount([], [], accountId),
        (accountId) => ({
            accountId,
            ...showAlert({ onlyError: true }),
        }),
    ],
    UPDATE_STAKING_LOCKUP: [
        async (accountId) => await wallet.staking.updateStakingLockup(accountId),
        (accountId) => ({
            accountId,
            ...showAlert({ onlyError: true }),
        }),
    ],
    GET_BALANCE: (...args) => wallet.getBalance(...args),
    SET_LOCAL_STORAGE: null,
    GET_ACCOUNT_BALANCE: [
        (...args) => wallet.getBalance(...args),
        (accountId) => ({
            accountId,
            alert: {
                ignoreMainLoader: true,
            },
        }),
    ],
    SET_ACCOUNT_BALANCE: null,
    CLEAR_ACCOUNT_STATE: null,
});
