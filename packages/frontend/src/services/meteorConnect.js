import { EMeteorAppId, MeteorConnect, webpage_local_storage } from '@meteorwallet/sdk';
import * as nearApiJs from 'near-api-js';
import CONFIG from '../config';
import { wallet } from '../utils/wallet';

export const meteorNetworkId =
    CONFIG.CURRENT_NEAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
const isTestnet = meteorNetworkId === 'testnet';
const meteorConnect = new MeteorConnect();
const NEW_KEY_TRANSFER_JOURNAL_KEY = 'mnw:new-key-transfer:v1';
const NEW_KEY_TRANSFER_BROWSER_LOCK = 'my-near-wallet::new-key-transfer-journal::v1';
const MIN_ADD_KEY_BALANCE_YOCTO = 2_000_000_000_000_000_000_000n;

const LIVE_BRIDGE_BACKEND_URL = 'https://mc.meteorwallet.app';

let initializePromise;
const journalLocks = new Map();

const withJournalLock = async (operation) => {
    const previous = journalLocks.get(NEW_KEY_TRANSFER_JOURNAL_KEY) || Promise.resolve();
    let release;
    const current = new Promise((resolve) => {
        release = resolve;
    });
    const queued = previous.then(() => current);
    journalLocks.set(NEW_KEY_TRANSFER_JOURNAL_KEY, queued);
    await previous;
    try {
        if (typeof navigator !== 'undefined' && navigator.locks != null) {
            return await navigator.locks.request(
                NEW_KEY_TRANSFER_BROWSER_LOCK,
                { mode: 'exclusive' },
                operation
            );
        }
        return await operation();
    } finally {
        release();
        if (journalLocks.get(NEW_KEY_TRANSFER_JOURNAL_KEY) === queued) {
            journalLocks.delete(NEW_KEY_TRANSFER_JOURNAL_KEY);
        }
    }
};

const getPartnerMetadata = () => {
    const origin = window.location.origin;
    return {
        name: 'My NEAR Wallet',
        description: 'Export your selected NEAR accounts to Meteor Wallet.',
        // The bridge backend only accepts https icon URLs — omit the icon on http dev origins.
        ...(origin.startsWith('https://') ? { iconUrl: `${origin}/favicon.svg` } : {}),
        originUrl: origin,
    };
};

/**
 * Same convention as the Meteor Wallet web frontend: always use the live bridge backend —
 * including local dev — so dev runs exercise the real infrastructure. Development builds may
 * override it for local-backend testing with an explicit `?mcBackend=<url>` query param
 * (`?mcBackend=local` is shorthand for the local wrangler backend on :8787). Production builds
 * ignore the param entirely: a link must never choose the backend in production.
 */
const resolveBridgeBackendUrl = () => {
    if (!CONFIG.IS_DEVELOPMENT || typeof window === 'undefined') {
        return LIVE_BRIDGE_BACKEND_URL;
    }
    const requested = new URL(window.location.href).searchParams.get('mcBackend');
    if (requested == null) {
        return LIVE_BRIDGE_BACKEND_URL;
    }
    const backendUrl = requested === 'local' ? 'http://localhost:8787' : requested;
    try {
        const url = new URL(backendUrl);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return LIVE_BRIDGE_BACKEND_URL;
        }
        // eslint-disable-next-line no-console
        console.info(
            `[MeteorConnect] dev backend override via ?mcBackend= → ${backendUrl}`
        );
        return backendUrl;
    } catch {
        return LIVE_BRIDGE_BACKEND_URL;
    }
};

const initializeMeteorConnect = () => {
    initializePromise ??= meteorConnect
        .initialize({
            storage: webpage_local_storage,
            mobileBridge: {
                enabled: true,
                backendUrl: resolveBridgeBackendUrl(),
                meteorAppId: isTestnet
                    ? EMeteorAppId.meteor_wallet_mobile_dev
                    : EMeteorAppId.meteor_wallet_mobile,
                partnerMetadata: getPartnerMetadata(),
                transferAccounts: {
                    enabled: true,
                },
            },
        })
        .catch((error) => {
            initializePromise = undefined;
            throw error;
        });

    return initializePromise;
};

export const promptMeteorAccountTransfer = async ({ accounts, networkId }) => {
    await initializeMeteorConnect();

    await meteorConnect.transferAccounts.clearStaged();

    try {
        for (const account of accounts) {
            const stageResult = await meteorConnect.transferAccounts.stage({
                networkId,
                accountId: account.accountId,
                secretInput: account.privateKey,
            });

            if (!stageResult.ok) {
                throw new Error(
                    `Could not prepare ${account.accountId} for export: ${stageResult.message}`
                );
            }
        }

        return await meteorConnect.transferAccounts.prompt();
    } finally {
        await meteorConnect.transferAccounts.clearStaged();
    }
};

const createOpaqueId = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const OPAQUE_ID_PATTERN = /^[A-Za-z0-9_-]{22,128}$/;
// Mirrors this wallet's pinned near-api-js-era account-id rules (utils.validateAccountId does not
// exist in near-api-js 0.45).
const NEAR_ACCOUNT_ID_PATTERN = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;
const START_ISSUES = new Set([
    'account_not_found',
    'source_key_not_found',
    'source_key_not_full_access',
    'rpc_lookup_failed',
    'pending_transfer_conflict',
    'key_generation_failed',
    'secure_storage_failed',
]);
const NEW_KEY_ROW_STATES = new Set([
    undefined,
    'add_key_intent',
    'add_key_submitted',
    'add_key_finalized',
    'verify_requested',
    'activation_verified',
    'destination_ready_source_cleanup_pending',
    'source_key_absent',
    'local_source_cleaned',
]);
const NEW_KEY_SESSION_PHASES = new Set([
    'created',
    'start_requested',
    'start_result_committed',
]);
const HASH_REQUIRED_STATES = new Set([
    'add_key_finalized',
    'verify_requested',
    'activation_verified',
    'destination_ready_source_cleanup_pending',
    'source_key_absent',
    'local_source_cleaned',
]);
const SDK_INTENT_REQUIRED_STATES = new Set([
    'add_key_submitted',
    ...HASH_REQUIRED_STATES,
]);

const rowKey = ({ networkId, accountId }) => `${networkId}:${accountId}`;

const asRecord = (value) =>
    value != null && typeof value === 'object' && !Array.isArray(value) ? value : null;

const hasOnlyKeys = (record, allowedKeys) => {
    const allowed = new Set(allowedKeys);
    return Object.keys(record).every((key) => allowed.has(key));
};

const isSafeTimestamp = (value) => Number.isSafeInteger(value) && value > 0;

const isNearAccountId = (value) =>
    typeof value === 'string' &&
    value.length >= 2 &&
    value.length <= 64 &&
    NEAR_ACCOUNT_ID_PATTERN.test(value);

const safeLocalError = (error, fallback) =>
    (error instanceof Error ? error.message : fallback).slice(0, 512);

const isNearPublicKey = (value) => {
    if (typeof value !== 'string' || !value.startsWith('ed25519:')) return false;
    try {
        return nearApiJs.utils.PublicKey.from(value).toString() === value;
    } catch {
        return false;
    }
};

const isNearTransactionHash = (value) => {
    if (typeof value !== 'string' || value.length > 64) return false;
    try {
        const decoded = nearApiJs.utils.serialize.base_decode(value);
        return (
            decoded.length === 32 &&
            nearApiJs.utils.serialize.base_encode(decoded) === value
        );
    } catch {
        return false;
    }
};

const isSerializedVerifyPublicKey = (value) => {
    const prefix = 'ed25519::raw_base64::';
    if (typeof value !== 'string' || !value.startsWith(prefix)) return false;
    try {
        const encoded = value.slice(prefix.length);
        const decoded = atob(encoded);
        return decoded.length === 32 && btoa(decoded) === encoded;
    } catch {
        return false;
    }
};

const isWalletConnection = (value) => {
    const connection = asRecord(value);
    return (
        connection != null &&
        hasOnlyKeys(connection, [
            'executionTarget',
            'schemaVersion',
            'bridgeEnvironmentId',
            'meteorAppId',
            'partnerClientId',
            'walletVerifyPublicKey',
        ]) &&
        connection.executionTarget === 'v2_bridge_mobile' &&
        connection.schemaVersion === 1 &&
        typeof connection.bridgeEnvironmentId === 'string' &&
        connection.bridgeEnvironmentId.length >= 1 &&
        connection.bridgeEnvironmentId.length <= 256 &&
        Object.values(EMeteorAppId).includes(connection.meteorAppId) &&
        typeof connection.partnerClientId === 'string' &&
        connection.partnerClientId.length >= 1 &&
        connection.partnerClientId.length <= 256 &&
        isSerializedVerifyPublicKey(connection.walletVerifyPublicKey)
    );
};

const isRequestedAccount = (value) =>
    value != null &&
    hasOnlyKeys(value, ['blockchainId', 'networkId', 'accountId', 'sourcePublicKey']) &&
    value.blockchainId === 'near' &&
    (value.networkId === 'mainnet' || value.networkId === 'testnet') &&
    isNearAccountId(value.accountId) &&
    isNearPublicKey(value.sourcePublicKey);

const isTransferRow = (value, requestedByKey) => {
    if (
        value == null ||
        !hasOnlyKeys(value, [
            'blockchainId',
            'networkId',
            'accountId',
            'sourcePublicKey',
            'destinationPublicKey',
            'destinationSignerType',
            'updatedAt',
            'state',
            'sdkIntentCommitted',
            'recovery',
            'lastError',
            'addKeyTransactionHash',
            'revocationIntent',
        ]) ||
        value.blockchainId !== 'near' ||
        (value.networkId !== 'mainnet' && value.networkId !== 'testnet') ||
        !isNearAccountId(value.accountId) ||
        !isNearPublicKey(value.sourcePublicKey) ||
        !isNearPublicKey(value.destinationPublicKey) ||
        value.sourcePublicKey === value.destinationPublicKey ||
        (value.destinationSignerType !== 'seed_phrase' &&
            value.destinationSignerType !== 'ledger') ||
        !isSafeTimestamp(value.updatedAt) ||
        !NEW_KEY_ROW_STATES.has(value.state) ||
        (value.recovery != null && value.recovery !== 'revoke_destination_key') ||
        (value.sdkIntentCommitted != null &&
            typeof value.sdkIntentCommitted !== 'boolean') ||
        (value.revocationIntent != null && typeof value.revocationIntent !== 'boolean') ||
        (value.lastError != null &&
            (typeof value.lastError !== 'string' || value.lastError.length > 512)) ||
        (value.addKeyTransactionHash != null &&
            !isNearTransactionHash(value.addKeyTransactionHash)) ||
        (value.addKeyTransactionHash != null && !HASH_REQUIRED_STATES.has(value.state)) ||
        (HASH_REQUIRED_STATES.has(value.state) &&
            !isNearTransactionHash(value.addKeyTransactionHash)) ||
        (SDK_INTENT_REQUIRED_STATES.has(value.state) &&
            value.sdkIntentCommitted !== true) ||
        (value.recovery != null &&
            (value.state !== 'add_key_submitted' ||
                value.addKeyTransactionHash != null)) ||
        (value.revocationIntent === true && value.recovery !== 'revoke_destination_key')
    ) {
        return false;
    }
    const requested = requestedByKey.get(`${value.networkId}:${value.accountId}`);
    return requested?.sourcePublicKey === value.sourcePublicKey;
};

const isRejectedRow = (value, requestedByKey) =>
    value != null &&
    hasOnlyKeys(value, ['blockchainId', 'networkId', 'accountId', 'ok', 'issue']) &&
    value.blockchainId === 'near' &&
    (value.networkId === 'mainnet' || value.networkId === 'testnet') &&
    isNearAccountId(value.accountId) &&
    value.ok === false &&
    START_ISSUES.has(value.issue) &&
    requestedByKey.has(rowKey(value));

const isNewKeyTransferSession = (session) => {
    if (
        session == null ||
        !hasOnlyKeys(session, [
            'formatVersion',
            'clientTransferId',
            'targetPlatform',
            'phase',
            'requestedAccounts',
            'accounts',
            'rejectedAccounts',
            'createdAt',
            'updatedAt',
            'transferSessionId',
            'walletConnection',
        ]) ||
        session.formatVersion !== 1 ||
        !OPAQUE_ID_PATTERN.test(session.clientTransferId || '') ||
        (session.targetPlatform !== 'web' &&
            session.targetPlatform !== 'mobile' &&
            session.targetPlatform !== 'web_local_dev') ||
        !NEW_KEY_SESSION_PHASES.has(session.phase) ||
        !Array.isArray(session.requestedAccounts) ||
        session.requestedAccounts.length < 1 ||
        session.requestedAccounts.length > 30 ||
        !session.requestedAccounts.every(isRequestedAccount) ||
        !Array.isArray(session.accounts) ||
        session.accounts.length > 30 ||
        !Array.isArray(session.rejectedAccounts) ||
        session.rejectedAccounts.length > 30 ||
        !isSafeTimestamp(session.createdAt) ||
        !isSafeTimestamp(session.updatedAt) ||
        session.updatedAt < session.createdAt
    ) {
        return false;
    }
    if (
        session.transferSessionId != null &&
        !OPAQUE_ID_PATTERN.test(session.transferSessionId)
    ) {
        return false;
    }
    if (
        session.accounts.length > 0 &&
        !OPAQUE_ID_PATTERN.test(session.transferSessionId || '')
    ) {
        return false;
    }
    const requestedByKey = new Map(
        session.requestedAccounts.map((account) => [rowKey(account), account])
    );
    if (requestedByKey.size !== session.requestedAccounts.length) return false;
    if (session.phase === 'created' || session.phase === 'start_requested') {
        return (
            session.transferSessionId == null &&
            session.walletConnection == null &&
            session.accounts.length === 0 &&
            session.rejectedAccounts.length === 0
        );
    }
    if (!isWalletConnection(session.walletConnection)) return false;
    if (!OPAQUE_ID_PATTERN.test(session.transferSessionId || '')) return false;
    if (!session.accounts.every((row) => isTransferRow(row, requestedByKey)))
        return false;
    if (
        session.accounts.some(
            (row) =>
                row.updatedAt < session.createdAt || row.updatedAt > session.updatedAt
        )
    ) {
        return false;
    }
    if (!session.rejectedAccounts.every((row) => isRejectedRow(row, requestedByKey)))
        return false;
    const resultKeys = [...session.accounts, ...session.rejectedAccounts].map(rowKey);
    if (new Set(resultKeys).size !== resultKeys.length) return false;
    if (
        resultKeys.length !== requestedByKey.size ||
        resultKeys.some((key) => !requestedByKey.has(key))
    ) {
        return false;
    }
    const destinationKeys = new Set(
        session.accounts.map((row) => row.destinationPublicKey)
    );
    const signerTypes = new Set(session.accounts.map((row) => row.destinationSignerType));
    return destinationKeys.size <= 1 && signerTypes.size <= 1;
};

export const assertNewKeyTransferJournal = (journal) => {
    const committedTransferSessionIds = Array.isArray(journal?.sessions)
        ? journal.sessions
              .map((session) => session?.transferSessionId)
              .filter((value) => value != null)
        : [];
    if (
        journal == null ||
        !hasOnlyKeys(journal, ['formatVersion', 'sessions']) ||
        journal.formatVersion !== 1 ||
        !Array.isArray(journal.sessions) ||
        journal.sessions.length > 100 ||
        !journal.sessions.every(isNewKeyTransferSession) ||
        new Set(journal.sessions.map((session) => session.clientTransferId)).size !==
            journal.sessions.length ||
        new Set(committedTransferSessionIds).size !== committedTransferSessionIds.length
    ) {
        throw new Error('The local new-key transfer journal is corrupt.');
    }
    return journal;
};

const loadNewKeyJournal = () => {
    const raw = localStorage.getItem(NEW_KEY_TRANSFER_JOURNAL_KEY);
    if (raw == null) {
        return { formatVersion: 1, sessions: [] };
    }
    return assertNewKeyTransferJournal(JSON.parse(raw));
};

const saveNewKeyJournal = (journal) => {
    localStorage.setItem(
        NEW_KEY_TRANSFER_JOURNAL_KEY,
        JSON.stringify(assertNewKeyTransferJournal(journal))
    );
};

const replaceNewKeySession = (session) => {
    const journal = loadNewKeyJournal();
    journal.sessions = journal.sessions.filter(
        (candidate) => candidate.clientTransferId !== session.clientTransferId
    );
    journal.sessions.push(session);
    saveNewKeyJournal(journal);
};

const getSession = (clientTransferId) =>
    loadNewKeyJournal().sessions.find(
        (session) => session.clientTransferId === clientTransferId
    );

const getExactSourceAccount = async (row) => {
    const keyPair = await wallet.getLocalKeyPair(row.accountId);
    if (keyPair == null || keyPair.getPublicKey().toString() !== row.sourcePublicKey) {
        throw new Error(`The exact source signer for ${row.accountId} is unavailable.`);
    }
    const keyStore = new nearApiJs.keyStores.InMemoryKeyStore();
    await keyStore.setKey(CONFIG.NETWORK_ID, row.accountId, keyPair);
    const connection = new nearApiJs.Connection(
        wallet.connection.networkId,
        wallet.connection.provider,
        new nearApiJs.InMemorySigner(keyStore)
    );
    return new nearApiJs.Account(connection, row.accountId);
};

const queryAccessKey = (accountId, publicKey) =>
    wallet.connection.provider.query({
        request_type: 'view_access_key',
        account_id: accountId,
        public_key: publicKey,
        finality: 'final',
    });

const isMissingAccessKeyError = (error) => {
    const type = error?.type || error?.message || '';
    return (
        String(type).includes('AccessKeyDoesNotExist') ||
        String(type).includes('AccountDoesNotExist')
    );
};

const accessKeyExists = async (accountId, publicKey) => {
    try {
        await queryAccessKey(accountId, publicKey);
        return true;
    } catch (error) {
        if (isMissingAccessKeyError(error)) {
            return false;
        }
        throw error;
    }
};

const preflightAddKeyBalance = async (row) => {
    const state = await (await getExactSourceAccount(row)).state();
    if (BigInt(state.amount) < MIN_ADD_KEY_BALANCE_YOCTO) {
        throw new Error(
            `${row.accountId} needs more available NEAR to add a destination key.`
        );
    }
};

const outcomeTransactionHash = (outcome) => {
    const hash = outcome?.transaction_outcome?.id;
    if (typeof hash !== 'string' || hash.length === 0) {
        throw new Error(
            'The finalized AddKey result did not contain a transaction hash.'
        );
    }
    return hash;
};

const addDestinationKey = async (session, row) => {
    if (row.state === 'add_key_submitted' && !row.addKeyTransactionHash) {
        if (await accessKeyExists(row.accountId, row.destinationPublicKey)) {
            row.recovery = 'revoke_destination_key';
            row.lastError =
                'The destination key is live but its exact transaction hash was lost. Revoke it before restarting.';
            replaceNewKeySession(session);
            return;
        }
        row.state = 'add_key_intent';
        replaceNewKeySession(session);
    }

    if (row.state !== 'add_key_intent') {
        row.state = 'add_key_intent';
        row.updatedAt = Date.now();
        replaceNewKeySession(session);
    }
    if (!row.sdkIntentCommitted) {
        await meteorConnect.newKeyTransfer.markAddKeyIntent({
            transferSessionId: session.transferSessionId,
            accounts: [
                {
                    blockchainId: 'near',
                    networkId: row.networkId,
                    accountId: row.accountId,
                },
            ],
        });
        row.sdkIntentCommitted = true;
        row.updatedAt = Date.now();
        replaceNewKeySession(session);
    }

    await preflightAddKeyBalance(row);
    row.state = 'add_key_submitted';
    row.lastError = undefined;
    row.updatedAt = Date.now();
    replaceNewKeySession(session);
    try {
        const account = await getExactSourceAccount(row);
        const outcome = await account.addKey(
            nearApiJs.utils.PublicKey.from(row.destinationPublicKey)
        );
        row.addKeyTransactionHash = outcomeTransactionHash(outcome);
        row.state = 'add_key_finalized';
        row.updatedAt = Date.now();
        replaceNewKeySession(session);
    } catch (error) {
        if (error?.type === 'AddKeyAlreadyExists') {
            row.recovery = 'revoke_destination_key';
            row.lastError =
                'The destination key already exists, but key presence is not authorization proof. Revoke it before restarting.';
        } else {
            row.lastError = safeLocalError(error, 'AddKey submission failed.');
        }
        row.updatedAt = Date.now();
        replaceNewKeySession(session);
    }
};

const verifyFinalizedDestinationKeys = async (session) => {
    const ready = session.accounts.filter(
        (row) =>
            (row.state === 'add_key_finalized' || row.state === 'verify_requested') &&
            row.addKeyTransactionHash
    );
    if (ready.length === 0) {
        return;
    }
    for (const row of ready) {
        row.state = 'verify_requested';
        row.updatedAt = Date.now();
    }
    replaceNewKeySession(session);

    try {
        const result = await meteorConnect.newKeyTransfer.verifyActive({
            transferSessionId: session.transferSessionId,
            activations: ready.map((row) => ({
                blockchainId: 'near',
                networkId: row.networkId,
                accountId: row.accountId,
                addKeyTransactionHash: row.addKeyTransactionHash,
            })),
        });
        const outputs = new Map(result.output.accounts.map((row) => [rowKey(row), row]));
        for (const row of ready) {
            const output = outputs.get(rowKey(row));
            if (output?.activation === 'verified') {
                row.state = 'activation_verified';
                row.updatedAt = Date.now();
                replaceNewKeySession(session);
                row.state = 'destination_ready_source_cleanup_pending';
                row.lastError = undefined;
            } else {
                row.state = 'add_key_finalized';
                row.lastError =
                    output?.issue || 'Destination activation was not verified.';
            }
            row.updatedAt = Date.now();
            replaceNewKeySession(session);
        }
    } catch (error) {
        for (const row of ready) {
            row.state = 'add_key_finalized';
            row.lastError = safeLocalError(error, 'Verification could not be completed.');
            row.updatedAt = Date.now();
        }
        replaceNewKeySession(session);
    }
};

const reconcileSourceCleanup = async (session) => {
    for (const row of session.accounts.filter(
        (item) => item.state === 'activation_verified'
    )) {
        row.state = 'destination_ready_source_cleanup_pending';
        row.updatedAt = Date.now();
        replaceNewKeySession(session);
    }
    const pending = session.accounts.filter(
        (row) => row.state === 'destination_ready_source_cleanup_pending'
    );
    for (const row of pending) {
        if (await accessKeyExists(row.accountId, row.sourcePublicKey)) {
            continue;
        }
        row.state = 'source_key_absent';
        row.updatedAt = Date.now();
        replaceNewKeySession(session);
        await wallet.removeLocalKeyIfMatches(row.accountId, row.sourcePublicKey);
        row.state = 'local_source_cleaned';
        row.updatedAt = Date.now();
        replaceNewKeySession(session);
    }
    for (const row of session.accounts.filter(
        (item) => item.state === 'source_key_absent'
    )) {
        await wallet.removeLocalKeyIfMatches(row.accountId, row.sourcePublicKey);
        row.state = 'local_source_cleaned';
        row.updatedAt = Date.now();
        replaceNewKeySession(session);
    }
};

const continueNewKeyTransfer = async (session, sourceAccounts) => {
    const sourceById = new Map(
        sourceAccounts.map((account) => [account.accountId, account])
    );
    if (session.phase === 'created' || session.phase === 'start_requested') {
        session.phase = 'start_requested';
        session.updatedAt = Date.now();
        replaceNewKeySession(session);
        const startResult = await meteorConnect.newKeyTransfer.start({
            clientTransferId: session.clientTransferId,
            targetPlatform: session.targetPlatform,
            accounts: session.requestedAccounts,
        });
        session.transferSessionId = startResult.output.transferSessionId;
        session.walletConnection = startResult.session.walletConnection;
        session.accounts = startResult.output.accounts
            .filter((row) => row.ok)
            .map((row) => {
                const source = sourceById.get(row.accountId);
                if (
                    !source ||
                    source.sourcePublicKey !==
                        session.requestedAccounts.find(
                            (candidate) => candidate.accountId === row.accountId
                        )?.sourcePublicKey
                ) {
                    throw new Error(
                        `The staged source key for ${row.accountId} changed.`
                    );
                }
                return {
                    blockchainId: 'near',
                    networkId: row.networkId,
                    accountId: row.accountId,
                    sourcePublicKey: source.sourcePublicKey,
                    destinationPublicKey: row.destinationPublicKey,
                    destinationSignerType: row.destinationSignerType,
                    updatedAt: Date.now(),
                };
            });
        session.rejectedAccounts = startResult.output.accounts.filter((row) => !row.ok);
        session.phase = 'start_result_committed';
        session.updatedAt = Date.now();
        replaceNewKeySession(session);
    }

    for (const row of session.accounts) {
        if (
            row.state == null ||
            row.state === 'add_key_intent' ||
            row.state === 'add_key_submitted'
        ) {
            await addDestinationKey(session, row);
        }
    }
    await verifyFinalizedDestinationKeys(session);
    await reconcileSourceCleanup(session);
    session.updatedAt = Date.now();
    replaceNewKeySession(session);
    return session;
};

export const startMeteorNewKeyAccountTransfer = async ({
    accounts,
    networkId,
    targetPlatform,
}) =>
    withJournalLock(async () => {
        await initializeMeteorConnect();
        if (accounts.length === 0 || accounts.length > 30) {
            throw new Error('Select between 1 and 30 eligible accounts.');
        }
        const clientTransferId = createOpaqueId();
        const session = {
            formatVersion: 1,
            clientTransferId,
            targetPlatform,
            phase: 'created',
            requestedAccounts: accounts.map(({ accountId, sourcePublicKey }) => ({
                blockchainId: 'near',
                networkId,
                accountId,
                sourcePublicKey,
            })),
            accounts: [],
            rejectedAccounts: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        replaceNewKeySession(session);
        return continueNewKeyTransfer(session, accounts);
    });

export const resumeMeteorNewKeyAccountTransfer = async (clientTransferId) =>
    withJournalLock(async () => {
        await initializeMeteorConnect();
        const session = getSession(clientTransferId);
        if (!session) {
            throw new Error('The new-key transfer session was not found.');
        }
        const sourceAccounts = await Promise.all(
            session.requestedAccounts.map(async ({ accountId, sourcePublicKey }) => {
                const keyPair = await wallet.getLocalKeyPair(accountId);
                return { accountId, sourcePublicKey, keyPair };
            })
        );
        return continueNewKeyTransfer(session, sourceAccounts);
    });

export const reconcileMeteorNewKeyAccountTransfer = async (clientTransferId) =>
    withJournalLock(async () => {
        const session = getSession(clientTransferId);
        if (!session) {
            throw new Error('The new-key transfer session was not found.');
        }
        await reconcileSourceCleanup(session);
        return session;
    });

export const revokeMeteorNewKeyDestination = async ({ clientTransferId, accountId }) =>
    withJournalLock(async () => {
        await initializeMeteorConnect();
        const session = getSession(clientTransferId);
        const row = session?.accounts.find((account) => account.accountId === accountId);
        if (!session || !row || row.recovery !== 'revoke_destination_key') {
            throw new Error('No revocable destination key was found for this account.');
        }
        const sourceAccount = await getExactSourceAccount(row);
        row.revocationIntent = true;
        row.updatedAt = Date.now();
        replaceNewKeySession(session);
        try {
            await sourceAccount.deleteKey(
                nearApiJs.utils.PublicKey.from(row.destinationPublicKey)
            );
        } catch (error) {
            if (!(await accessKeyExists(row.accountId, row.destinationPublicKey))) {
                // A lost response converges on the same finalized absence.
            } else {
                throw error;
            }
        }
        if (await accessKeyExists(row.accountId, row.destinationPublicKey)) {
            throw new Error('The destination key is still active after revocation.');
        }
        await meteorConnect.newKeyTransfer.markDestinationKeysRevoked({
            transferSessionId: session.transferSessionId,
            accounts: [
                {
                    blockchainId: 'near',
                    networkId: row.networkId,
                    accountId: row.accountId,
                },
            ],
        });
        row.recovery = undefined;
        row.revocationIntent = false;
        row.sdkIntentCommitted = false;
        row.state = undefined;
        row.addKeyTransactionHash = undefined;
        row.lastError = undefined;
        row.updatedAt = Date.now();
        replaceNewKeySession(session);
        return session;
    });

export const getMeteorNewKeyTransferSessions = () => loadNewKeyJournal().sessions;
