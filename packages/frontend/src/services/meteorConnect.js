import {
    deriveLocalBackendUrl,
    EMeteorAppId,
    METEOR_CONNECT_BACKENDS,
    MeteorConnect,
    webpage_local_storage,
} from '@meteorwallet/sdk';

import {
    createWalletAddKeyChain,
    removeDestinationKeyWithSourceSigner,
} from './meteorConnectAddKeyChain';
import CONFIG from '../config';

export const meteorNetworkId =
    CONFIG.CURRENT_NEAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
const isTestnet = meteorNetworkId === 'testnet';
const meteorConnect = new MeteorConnect();

let initializePromise;

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
 * Which Meteor Connect bridge backend this build dials.
 *
 * A production build always dials production and ignores the query param entirely: a link must
 * never be able to choose which host this wallet hands a transfer to. A development build dials
 * the development backend — the same one the Meteor SDK harness and a locally served Meteor
 * Wallet meet on — and may be pointed elsewhere with `?mcBackend=<url>`, where `local` is
 * shorthand for the wrangler backend served from this page's own host.
 *
 * The URLs come from the SDK's own `METEOR_CONNECT_BACKENDS` rather than being spelled out here,
 * so a backend move arrives with an SDK upgrade instead of as a silent mismatch.
 */
const resolveBridgeBackendUrl = () => {
    if (!CONFIG.IS_DEVELOPMENT || typeof window === 'undefined') {
        return METEOR_CONNECT_BACKENDS.production;
    }
    const requested = new URL(window.location.href).searchParams.get('mcBackend');
    if (requested == null) {
        return METEOR_CONNECT_BACKENDS.development;
    }
    const backendUrl =
        requested === 'local'
            ? deriveLocalBackendUrl(window.location.hostname)
            : METEOR_CONNECT_BACKENDS[requested] || requested;
    try {
        const url = new URL(backendUrl);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return METEOR_CONNECT_BACKENDS.development;
        }
        // eslint-disable-next-line no-console
        console.info(
            `[MeteorConnect] dev backend override via ?mcBackend= → ${backendUrl}`
        );
        return backendUrl;
    } catch {
        return METEOR_CONNECT_BACKENDS.development;
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

/* ────────────────────────────────────────────────────────────────────────────────────────────
 * New-key transfer
 *
 * The secret-free export: Meteor mints a fresh keypair per account and returns only the PUBLIC
 * halves, this wallet AddKeys them on-chain with each account's own full-access key, and Meteor
 * verifies each key is live before importing. No private key or recovery phrase crosses the
 * bridge in either direction.
 *
 * Three turns, in order, over one held bridge session:
 *
 *   1. start()       → Meteor mints destination keys, returns their public halves
 *   2. runAddKeys()  → THIS wallet signs and broadcasts the AddKeys (no Meteor involvement)
 *   3. verifyActive() → Meteor confirms each key is live on-chain, then imports
 *
 * Step 2 runs under the SDK's crash-safe AddKey journal, through the chain seam in
 * `meteorConnectAddKeyChain`. A broadcast AddKey cannot be un-broadcast, so the journal — not
 * this module and not the screens — owns what happens after a crash. Every durable invariant
 * (journal-before-chain-call, intent before signing, exact signed bytes before broadcast,
 * same-bytes-only rebroadcast, finality proven before checkpointing) belongs to the SDK and is
 * deliberately not re-implemented here.
 * ──────────────────────────────────────────────────────────────────────────────────────────── */

const MAX_NEW_KEY_TRANSFER_ACCOUNTS = 30;

const newKeyTransfer = () => meteorConnect.newKeyTransfer;

export const getMeteorNewKeyTransferSessions = async () => {
    await initializeMeteorConnect();
    return newKeyTransfer().getSessions();
};

const getRecoveryState = async () => {
    await initializeMeteorConnect();
    return newKeyTransfer().getRecoveryState();
};

/**
 * The AddKey journal holds exactly ONE start result, and only `clear()` on that exact transfer
 * removes it. A start result is written whenever Meteor ANSWERS — including when it accepts
 * nothing — so a transfer abandoned before its AddKeys poisons the journal, and every later start
 * dies on `start_result_conflict` after Meteor has already minted keys for it.
 *
 * Sweep it here instead. Only transfers with no journaled AddKey intent can be cleared, which is
 * exactly the set that is safe to drop: nothing of theirs ever reached a chain.
 */
const discardLeftoverStartResult = async () => {
    const { startResult } = await newKeyTransfer().getRecoveryState();
    if (startResult == null) {
        return;
    }
    const stale = (await newKeyTransfer().getSessions()).find(
        (session) =>
            session.startOutput?.transferSessionId === startResult.output.transferSessionId
    );
    if (stale == null) {
        // Nothing to clear it through; `start` will refuse with its own conflict error rather
        // than mint a second set of destination keys over the top of it.
        return;
    }
    try {
        await newKeyTransfer().clear(stale.clientTransferId);
    } catch (error) {
        // Not clearable means it holds real recovery state. Say that plainly rather than failing
        // later with the journal's own, much more cryptic, conflict message.
        throw new Error(
            `An earlier transfer still needs to be resolved before a new one can start: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
};

/**
 * Ask Meteor to mint destination keys for these accounts. Returns the SDK session; the caller
 * reads which accounts were accepted from `session.startOutput`.
 */
export const startMeteorNewKeyAccountTransfer = async ({
    accounts,
    networkId,
    targetPlatform,
}) => {
    await initializeMeteorConnect();
    if (accounts.length === 0 || accounts.length > MAX_NEW_KEY_TRANSFER_ACCOUNTS) {
        throw new Error(
            `Select between 1 and ${MAX_NEW_KEY_TRANSFER_ACCOUNTS} eligible accounts.`
        );
    }
    await discardLeftoverStartResult();

    const result = await newKeyTransfer().start({
        targetPlatform,
        accounts: accounts.map(({ accountId, sourcePublicKey }) => ({
            blockchainId: 'near',
            networkId,
            accountId,
            sourcePublicKey,
        })),
    });

    // A transfer Meteor accepted nothing for is deliberately NOT discarded here: its refusal
    // reasons are the only thing the user can act on, and they live in the session. It cannot
    // shadow a later transfer — nothing was minted, so `discardLeftoverStartResult` sweeps it on
    // the next attempt, and the screen that shows the reasons clears it on the way out.
    return result.session;
};

/**
 * Sign and broadcast every pending AddKey for one transfer, then durably record the verification
 * request. `onProgress` reports 1-based position across the accounts still to submit.
 */
export const runMeteorNewKeyAddKeys = async ({ transferSessionId, onProgress }) => {
    await initializeMeteorConnect();
    return newKeyTransfer().runAddKeys({
        transferSessionId,
        chain: createWalletAddKeyChain(),
        onProgress,
    });
};

/**
 * Whether this transfer's AddKeys are finished — which is true exactly when their verification
 * proof is journaled, not when the session phase says so. This, not the phase, is what makes the
 * activation screen reload-safe: a second `runAddKeys` on a finished transfer meets a start
 * result that was deliberately discarded and fails `start_result_journal_missing`.
 */
export const hasJournaledMeteorNewKeyVerification = async (transferSessionId) => {
    const { pendingVerification } = await getRecoveryState();
    return pendingVerification != null &&
        pendingVerification.transferSessionId === transferSessionId;
};

/**
 * Ask Meteor to prove each destination key is live and import the accounts.
 *
 * The journal holds the exact proof Meteor must be asked with; a regenerated one is refused, so
 * there is nothing useful to send without it.
 */
export const verifyMeteorNewKeyAccountTransfer = async ({ transferSessionId }) => {
    const { pendingVerification } = await getRecoveryState();
    if (
        pendingVerification == null ||
        pendingVerification.transferSessionId !== transferSessionId
    ) {
        throw new Error('new_key_transfer_verification_proof_missing');
    }
    return newKeyTransfer().verifyActive({
        transferSessionId,
        activations: pendingVerification.activations,
    });
};

/**
 * Forget a transfer that never reached a chain. Refused by the SDK once an AddKey intent is
 * journaled — at that point the destination key may be live and the record is a recovery fence,
 * not clutter.
 */
export const clearMeteorNewKeyAccountTransfer = async (clientTransferId) => {
    await initializeMeteorConnect();
    await newKeyTransfer().clear(clientTransferId);
};

/* ────────────────────────────────────────────────────────────────────────────────────────────
 * Fenced-transfer reconciliation
 *
 * A journaled `transaction_signed` AddKey whose start-result record is gone is fail-closed on
 * purpose: the bytes may still land, so nothing new may start and the row must not be cleared.
 * Before this, that was the whole story a user got — the resume route refused, starting again
 * refused, and the error copy pointed at a support reference that was never rendered. The browser
 * profile was stranded for good (REVIEW-consumer-implementation B-04).
 *
 * The SDK now exposes the evidence and a chain-backed state machine. Nothing here decides
 * anything: it reads the report, advances one operation at a time, and archives only what the SDK
 * itself has re-proven absent on-chain.
 * ──────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * What is fencing this device, in non-secret terms: the affected accounts, the source and
 * destination public keys, the transaction hashes, and a stable support reference to quote.
 * `{ fenced: false }` when there is nothing to resolve.
 */
export const getMeteorNewKeyReconciliationReport = async () => {
    await initializeMeteorConnect();
    return newKeyTransfer().getReconciliationReport();
};

/**
 * Advance ONE fenced operation as far as the chain allows. Never signs, never broadcasts a new
 * transaction; the only change it can make is promoting a proven AddKey to finalized.
 *
 * Returns the SDK's status verbatim — `finalized`, `destination_key_present_unproven`,
 * `destination_key_absent`, `ambiguous`, `not_found` — because each one means a different next
 * step for the user and collapsing them would put us back where we started.
 */
export const reconcileMeteorNewKeyFencedOperation = async (operation) => {
    await initializeMeteorConnect();
    return newKeyTransfer().reconcileFencedOperation({
        operation,
        chain: createWalletAddKeyChain(),
    });
};

/**
 * Retire a fenced operation. The SDK re-proves on-chain absence of the exact destination key
 * first, so this cannot be used to clear the fence by asserting the key is gone — only by it
 * actually being gone.
 */
export const archiveMeteorNewKeyFencedOperation = async (operation) => {
    await initializeMeteorConnect();
    return newKeyTransfer().archiveReconciledOperation({
        operation,
        chain: createWalletAddKeyChain(),
    });
};

/**
 * Remove a destination key this wallet granted, using the account's own SOURCE full-access key.
 *
 * This is the step behind `destination_key_present_unproven`: the key is on the account but
 * nothing binds it to a transfer, so it must come off before the record can be retired. The
 * removal is an ordinary DeleteKey signed locally — the SDK is not involved and never sees the
 * signing material.
 */
export const removeMeteorNewKeyDestinationKey = async (operation) =>
    removeDestinationKeyWithSourceSigner(operation);
