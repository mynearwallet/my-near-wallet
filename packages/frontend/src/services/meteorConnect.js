import {
    deriveLocalBackendUrl,
    EMeteorAppId,
    METEOR_CONNECT_BACKENDS,
    MeteorConnect,
    webpage_local_storage,
} from '@meteorwallet/sdk';

import {
    assertSelectionCanAffordAddKeys,
    createWalletAddKeyChain,
    isDestinationKeyAbsentOnChain,
    isSourceKeyAbsentOnChain,
    removeDestinationKeyWithSourceSigner,
    waitForDestinationKeyAbsence,
} from './meteorConnectAddKeyChain';
import {
    resolveMeteorConnectEnvironment,
    resolveMeteorWalletWebUrl,
} from './meteorConnectEnvironment';
import {
    newKeyStartInputFingerprint,
    resolveNewKeyStartOverPlan,
    resolveNewKeyStartReplayPlan,
} from './newKeyTransferState';
import CONFIG from '../config';

/**
 * The NEAR network the transferred accounts live on. Deliberately SEPARATE from
 * `meteorConnectEnvironment` below: a mainnet staging build transfers real mainnet accounts over
 * the development bridge, so the network and the bridge environment no longer move together.
 */
export const meteorNetworkId =
    CONFIG.CURRENT_NEAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
/**
 * Which Meteor Connect environment this build belongs to — ONE decision that both the bridge
 * backend and the Meteor wallet app id are derived from, immediately below.
 *
 * They have to agree: the bridge issues the link that opens the Meteor wallet, so a session
 * created on one environment can only be claimed by the wallet of that same environment.
 *
 *   mainnet (app.mynearwallet.com)  → production bridge   +  production Meteor wallet
 *   everything else — every staging → development bridge  +  dev Meteor wallet
 *   deploy, testnet, local dev         (wallet-dev.meteorwallet.app)
 *
 * The decision follows the DEPLOYED environment (`NEAR_WALLET_ENV`), not the NEAR network and not
 * the build mode (2026-08-27): staging builds — mainnet staging included — must exercise the
 * transfer flow end-to-end against our own development stack without depending on the production
 * rollout state. See `meteorConnectEnvironment.js` for the accepted trade-off.
 */
const meteorConnectEnvironment = resolveMeteorConnectEnvironment(CONFIG.NEAR_WALLET_ENV);
export const meteorWalletWebUrl = resolveMeteorWalletWebUrl(
    typeof window === 'undefined' ? '' : window.location.hostname
);

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
 * The host comes from `meteorConnectEnvironment` above, so it always matches the Meteor wallet
 * this build asks for. The URLs themselves come from the SDK's own `METEOR_CONNECT_BACKENDS`
 * rather than being spelled out here, so a backend move arrives with an SDK upgrade instead of as
 * a silent mismatch.
 *
 * `?mcBackend=<url>` stays gated on a LOCAL development build (`CONFIG.IS_DEVELOPMENT`, i.e.
 * `NODE_ENV=development`) and is deliberately NOT extended to deployed testnet/staging builds: a
 * link must never be able to choose which host this wallet hands a transfer to, and a deployed
 * build is reached by following links. `local` is shorthand for the wrangler backend served from
 * this page's own host.
 */
/**
 * Where a `?mcBackend=` choice survives between page loads. The override used to be read from the
 * URL once at module init, so ANY navigation that dropped the query — the login redirect above
 * all — silently flipped a development session back to the DEPLOYED dev backend mid-transfer.
 * Against a locally upgraded protocol that surfaces as a baffling contract-version refusal
 * (Phase 6 qualification). Sticky-until-cleared is the honest semantics for a dev override:
 * `?mcBackend=local` turns it on, `?mcBackend=default` turns it off.
 */
const DEV_BACKEND_OVERRIDE_STORAGE_KEY = 'mnw:meteorConnect:mcBackend';

const readStoredDevBackendChoice = () => {
    try {
        return window.localStorage.getItem(DEV_BACKEND_OVERRIDE_STORAGE_KEY);
    } catch {
        return null;
    }
};

const writeStoredDevBackendChoice = (value) => {
    try {
        if (value == null) {
            window.localStorage.removeItem(DEV_BACKEND_OVERRIDE_STORAGE_KEY);
        } else {
            window.localStorage.setItem(DEV_BACKEND_OVERRIDE_STORAGE_KEY, value);
        }
    } catch {
        // Storage failure only costs stickiness; the URL parameter still works per load.
    }
};

const resolveBridgeBackendUrl = () => {
    const environmentUrl = METEOR_CONNECT_BACKENDS[meteorConnectEnvironment];
    if (!CONFIG.IS_DEVELOPMENT || typeof window === 'undefined') {
        return environmentUrl;
    }
    const fromUrl = new URL(window.location.href).searchParams.get('mcBackend');
    if (fromUrl === 'default') {
        writeStoredDevBackendChoice(null);
    } else if (fromUrl != null) {
        writeStoredDevBackendChoice(fromUrl);
    }
    /**
     * Priority: explicit URL param, then the remembered choice, then the BUILD-TIME default.
     * The env default is what a dev server started with `REACT_APP_MC_BACKEND=local` uses for
     * every load — immune to login redirects, fresh tabs, and new-account entry points, all of
     * which dropped the URL param and silently sent qualification traffic to the deployed dev
     * backend (Phase 6, twice).
     */
    const requested =
        fromUrl === 'default'
            ? null
            : fromUrl ??
              readStoredDevBackendChoice() ??
              CONFIG.MC_BACKEND_DEFAULT ??
              null;
    if (requested == null) {
        // eslint-disable-next-line no-console
        console.info(`[MeteorConnect] backend: ${environmentUrl} (environment default)`);
        return environmentUrl;
    }
    const backendUrl =
        requested === 'local'
            ? deriveLocalBackendUrl(window.location.hostname)
            : METEOR_CONNECT_BACKENDS[requested] || requested;
    try {
        const url = new URL(backendUrl);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return environmentUrl;
        }
        // eslint-disable-next-line no-console
        console.info(
            `[MeteorConnect] backend: ${backendUrl} (dev override "${requested}"${
                fromUrl == null ? ', remembered from a previous load' : ''
            }; clear with ?mcBackend=default)`
        );
        return backendUrl;
    } catch {
        return environmentUrl;
    }
};

const initializeMeteorConnect = () => {
    initializePromise ??= meteorConnect
        .initialize({
            storage: webpage_local_storage,
            mobileBridge: {
                enabled: true,
                backendUrl: resolveBridgeBackendUrl(),
                // Same `meteorConnectEnvironment` the backend URL above is derived from — the
                // SDK maps this mobile id onto the matching WEB wallet for a "web" transfer
                // target (`meteor_wallet_mobile_dev` → `meteor_wallet_web_dev`), so this one
                // value decides both the app the bridge links to and the app the bridge is on.
                meteorAppId:
                    meteorConnectEnvironment === 'development'
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
            session.startOutput?.transferSessionId ===
            startResult.output.transferSessionId
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
 * Where the durable start id lives between an interrupted start and its replay (stabilization
 * SD7). Meteor journals its half of a start under the client transfer id — including the
 * committed-but-unconfirmed state where the user is mid-way through confirming the recovery
 * phrase when the bridge session expires. Retrying with the SAME id resumes that exact state;
 * retrying with a fresh one asks Meteor to mint a second set of destination keys.
 */
const PENDING_START_STORAGE_KEY = 'mnw:newKeyTransfer:pendingStart:v1';

const readPendingStart = () => {
    try {
        const raw = window.localStorage.getItem(PENDING_START_STORAGE_KEY);
        return raw == null ? null : JSON.parse(raw);
    } catch {
        return null;
    }
};

const writePendingStart = (value) => {
    try {
        if (value == null) {
            window.localStorage.removeItem(PENDING_START_STORAGE_KEY);
        } else {
            window.localStorage.setItem(PENDING_START_STORAGE_KEY, JSON.stringify(value));
        }
    } catch {
        // Quota or privacy-mode failure: the transfer still works, only expiry-replay degrades —
        // a retry after expiry will mint fresh keys, which Meteor's own recovery screen can
        // discard. Never let bookkeeping break the transfer itself.
    }
};

/**
 * Ask Meteor to mint destination keys for these accounts. Returns the SDK session; the caller
 * reads which accounts were accepted from `session.startOutput`.
 *
 * No target platform is pinned here: the SDK popup owns the destination choice (Meteor Web /
 * Meteor Mobile / dev-gated local wallet) and records what was chosen on the session, which the
 * verify turn is then pinned to.
 *
 * A failed attempt leaves its id stashed; calling this again with the SAME accounts replays that
 * id (SD7), so a bridge expiry while the user was mid-confirmation in Meteor costs nothing. The
 * interim screen's "Continue" button is exactly this call, repeated.
 */
export const startMeteorNewKeyAccountTransfer = async ({ accounts, networkId }) => {
    await initializeMeteorConnect();
    if (accounts.length === 0 || accounts.length > MAX_NEW_KEY_TRANSFER_ACCOUNTS) {
        throw new Error(
            `Select between 1 and ${MAX_NEW_KEY_TRANSFER_ACCOUNTS} eligible accounts.`
        );
    }
    const inputFingerprint = newKeyStartInputFingerprint({
        accounts,
        networkId,
    });
    const plan = resolveNewKeyStartReplayPlan({
        stored: readPendingStart(),
        inputFingerprint,
    });
    if (!plan.isReplay) {
        // The leftover-result sweep stays OFF the replay path: on a replay, the wallet side may
        // hold this very transfer mid-confirmation, and its earlier sessions are what the replay
        // converges with. Sweeping belongs only to a genuinely new request.
        await discardLeftoverStartResult();
    }

    const request = {
        ...(plan.clientTransferId != null
            ? { clientTransferId: plan.clientTransferId }
            : {}),
        accounts: accounts.map(({ accountId, sourcePublicKey }) => ({
            blockchainId: 'near',
            networkId,
            accountId,
            sourcePublicKey,
        })),
    };

    let result;
    try {
        // Stash BEFORE asking: the id must survive a crash between Meteor journaling its half and
        // this wallet hearing the answer. The SDK generates the id when we did not supply one, so
        // a first attempt stashes after the call instead.
        if (plan.clientTransferId != null) {
            writePendingStart({
                clientTransferId: plan.clientTransferId,
                inputFingerprint,
            });
        }
        result = await newKeyTransfer().start(request);
    } catch (error) {
        if (plan.clientTransferId == null) {
            // First attempt failed and the SDK generated the id internally. If it journaled a
            // session before failing, stash ITS id so the retry replays instead of re-minting.
            try {
                const sessions = await newKeyTransfer().getSessions();
                const interrupted = sessions[sessions.length - 1];
                if (
                    interrupted != null &&
                    interrupted.startOutput == null &&
                    interrupted.phase === 'start_pending'
                ) {
                    writePendingStart({
                        clientTransferId: interrupted.clientTransferId,
                        inputFingerprint,
                    });
                }
            } catch {
                // The stash is an optimization for replay; failing to read sessions here must
                // not mask the start error itself.
            }
        }
        throw error;
    }
    writePendingStart(null);

    // A transfer Meteor accepted nothing for is deliberately NOT discarded here: its refusal
    // reasons are the only thing the user can act on, and they live in the session. It cannot
    // shadow a later transfer — nothing was minted, so `discardLeftoverStartResult` sweeps it on
    // the next attempt, and the screen that shows the reasons clears it on the way out.
    return result.session;
};

/** Whether an interrupted start is waiting to be replayed (drives the "Continue" affordance). */
export const hasPendingMeteorNewKeyStart = () => readPendingStart() != null;

/** Drop the stashed start id — the deliberate "start over" half of SD7. The wallet side is
 * released separately via `clearMeteorNewKeyAccountTransfer`, which sweeps by the same id. */
export const discardPendingMeteorNewKeyStart = () => writePendingStart(null);

/**
 * Sign and broadcast every pending AddKey for one transfer, then durably record the verification
 * request. `onProgress` reports 1-based position across the accounts still to submit.
 *
 * Before the FIRST broadcast, the whole selection is balance-checked at once (available balance,
 * not total — MNW-10): finding out on account four that account four cannot pay leaves a transfer
 * half on-chain, which the journal survives but the user should never be walked into.
 */
export const runMeteorNewKeyAddKeys = async ({ transferSessionId, onProgress }) => {
    await initializeMeteorConnect();
    const session = (await newKeyTransfer().getSessions()).find(
        (candidate) => candidate.startOutput?.transferSessionId === transferSessionId
    );
    const hasJournaledIntent = (session?.addKeyIntentAccounts || []).length > 0;
    if (session != null && !hasJournaledIntent) {
        // Only before anything is journaled: on a resume, some AddKeys may already be signed or
        // live, and a balance dip must not block reconciling them. The per-job check inside the
        // chain seam still guards each remaining signature.
        await assertSelectionCanAffordAddKeys(
            (session.startOutput?.accounts || [])
                .filter((row) => row.ok)
                .map((row) => row.accountId)
        );
    }
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
    return (
        pendingVerification != null &&
        pendingVerification.transferSessionId === transferSessionId
    );
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
 * Re-ask Meteor for the current per-account state of a verified transfer (stabilization SD8).
 *
 * Verification is idempotent and convergent: a row Meteor answered `verified_pending_completion`
 * for — import unfinished, or the working-account test transfer failed — is finished on Meteor's
 * side by exactly this call. The journaled proof is reused verbatim; the SDK opens a fresh
 * session when the original hold is gone.
 */
export const checkMeteorNewKeyTransferStatus = async ({ transferSessionId }) =>
    verifyMeteorNewKeyAccountTransfer({ transferSessionId });

/**
 * Forget a transfer that never reached a chain. Refused by the SDK once an AddKey intent is
 * journaled — at that point the destination key may be live and the record is a recovery fence,
 * not clutter.
 */
export const clearMeteorNewKeyAccountTransfer = async (clientTransferId) => {
    await initializeMeteorConnect();
    discardPendingMeteorNewKeyStart();
    await newKeyTransfer().clear(clientTransferId);
};

/**
 * Abandon one transfer — at any stage short of Meteor having SECURED accounts — so the user can
 * start again, with a different destination wallet if they like.
 *
 * The pure planner (`resolveNewKeyStartOverPlan`) decides what abandoning costs here:
 *
 * - nothing journaled → drop the stashed replay id (and sweep a crash-window orphaned start
 *   result so the NEXT start cannot die on `start_result_conflict`);
 * - session but no AddKey intent → the SDK's own `clear()`;
 * - intent journaled, nothing secured → the honest late-cancel: remove each destination key with
 *   the account's own SOURCE key, wait until each removal is provable at finality, let the SDK
 *   acknowledge the revocation (it re-proves absence itself — an assurance is never enough), then
 *   clear the record;
 * - anything secured, or records that cannot be resolved → refuse with a typed code the screens
 *   have real copy for.
 *
 * `onProgress` reports 1-based key-removal progress. Idempotent per stage: a key already absent
 * is skipped, and a rerun after a partial failure resumes with the keys still present.
 */
export const startOverMeteorNewKeyTransfer = async ({
    clientTransferId,
    onProgress,
} = {}) => {
    await initializeMeteorConnect();
    const targetId = clientTransferId ?? readPendingStart()?.clientTransferId ?? null;
    discardPendingMeteorNewKeyStart();
    const session =
        targetId == null
            ? null
            : (await newKeyTransfer().getSessions()).find(
                  (candidate) => candidate.clientTransferId === targetId
              );
    const plan = resolveNewKeyStartOverPlan({ session });
    if (plan.kind === 'refuse_secured') {
        throw new Error('new_key_transfer_start_over_secured_rows');
    }
    if (plan.kind === 'refuse_unresolvable') {
        throw new Error('new_key_transfer_start_over_unresolvable');
    }
    if (plan.kind === 'discard_stash_only') {
        try {
            await newKeyTransfer().discardOrphanedStartResult();
        } catch (error) {
            // A result some OTHER session references is that session's live state — the normal
            // start-path sweep owns it. Anything else (a protected journal above all) is a real
            // fence and must surface, not vanish under "start over".
            if (
                !(error instanceof Error) ||
                error.message !== 'new_key_transfer_start_result_referenced'
            ) {
                throw error;
            }
        }
        return { revokedAccountIds: [] };
    }
    if (plan.kind === 'clear') {
        await newKeyTransfer().clear(plan.clientTransferId);
        return { revokedAccountIds: [] };
    }
    // revoke_then_clear — the destination keys may be live on-chain.
    const revokedAccountIds = [];
    const total = plan.accounts.length;
    for (const [index, account] of plan.accounts.entries()) {
        onProgress?.({ accountId: account.accountId, index: index + 1, total });
        if (!(await isDestinationKeyAbsentOnChain(account))) {
            await removeDestinationKeyWithSourceSigner(account);
            await waitForDestinationKeyAbsence(account);
            revokedAccountIds.push(account.accountId);
        }
    }
    await newKeyTransfer().markDestinationKeysRevoked({
        transferSessionId: plan.transferSessionId,
        accounts: plan.accounts.map(({ blockchainId, networkId, accountId }) => ({
            blockchainId,
            networkId,
            accountId,
        })),
        chain: createWalletAddKeyChain(),
    });
    await newKeyTransfer().clear(plan.clientTransferId);
    return { revokedAccountIds };
};

/**
 * Retire a fully secured transfer out of the live journal (stabilization SD10). The SDK refuses
 * anything not terminal, so this can never hide unfinished work; it is how the journal's capacity
 * check is answered without deleting history.
 */
export const archiveMeteorNewKeyTransfer = async (clientTransferId) => {
    await initializeMeteorConnect();
    await newKeyTransfer().archiveCompletedSession(clientTransferId);
};

/**
 * Whether an account's OLD source key is still on the account at finality (stabilization §6.2).
 *
 * Meteor's cleanup step removes the source key from the other side; this wallet must OBSERVE that
 * absence before suggesting local-key deletion or calling anything "cleaned" — a local guess
 * would let the user delete their only working key on the strength of nothing.
 */
export const isMeteorNewKeySourceKeyAbsent = async ({ accountId, sourcePublicKey }) =>
    isSourceKeyAbsentOnChain({ accountId, sourcePublicKey });

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
