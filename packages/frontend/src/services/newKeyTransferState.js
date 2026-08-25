/**
 * Pure readers over an SDK new-key transfer session (`INewKeyTransferSdkSession`).
 *
 * Deliberately dependency-free — no SDK import, no wallet import — so the export screens and the
 * unit tests can both reason about a transfer's state without initializing Meteor Connect.
 */

/**
 * The protocol's account identity string, which `addKeyIntentAccounts` and `verifiedAccounts` are
 * lists of. Re-stated here rather than imported: the SDK keeps its helper on an `/internal`
 * subpath, and this format is fixed by the wire protocol, not by the SDK build.
 */
export const newKeyTransferAccountIdentity = ({ blockchainId, networkId, accountId }) =>
    `${blockchainId}::${networkId}::${accountId}`;

/**
 * One transfer, read the way the screens need it: which accounts Meteor accepted, which it
 * refused and why, and how far the accepted ones have got.
 *
 * Stabilization SD4/SD6: "verified" is no longer one fact. A row is SECURED only when Meteor has
 * proven the key, confirmed the recovery phrase in full, and imported the account; a row Meteor
 * verified but has not finished securing is PENDING COMPLETION and must never render as done.
 */
export const summarizeNewKeyTransferSession = (session) => {
    if (session == null) {
        return null;
    }
    const rows = session.startOutput?.accounts || [];
    const verified = new Set(session.verifiedAccounts || []);
    const secured = new Set(session.securedAccounts || []);
    const pendingCompletion = new Set(session.pendingCompletionAccounts || []);
    const requestedByIdentity = new Map(
        (session.startRequest?.accounts || []).map((account) => [
            newKeyTransferAccountIdentity(account),
            account,
        ])
    );
    const accepted = rows
        .filter((row) => row.ok)
        .map((row) => {
            const identity = newKeyTransferAccountIdentity(row);
            return {
                accountId: row.accountId,
                networkId: row.networkId,
                destinationPublicKey: row.destinationPublicKey,
                /** The exact OLD key this transfer replaces — what cleanup observation checks. */
                sourcePublicKey: requestedByIdentity.get(identity)?.sourcePublicKey,
                /** Chain proof accepted — the union of secured and pending-completion. */
                isVerified: verified.has(identity),
                /** Finished on Meteor's side: proven, recovery confirmed, imported. */
                isSecured: secured.has(identity),
                /** Meteor proved the key but still owes completion work; re-verify converges. */
                isPendingCompletion: pendingCompletion.has(identity),
            };
        });

    return {
        clientTransferId: session.clientTransferId,
        transferSessionId: session.startOutput?.transferSessionId,
        targetPlatform: session.targetPlatform,
        phase: session.phase,
        accepted,
        securedCount: accepted.filter((account) => account.isSecured).length,
        pendingCompletionCount: accepted.filter((account) => account.isPendingCompletion)
            .length,
        refused: rows
            .filter((row) => !row.ok)
            .map((row) => ({ accountId: row.accountId, issue: row.issue })),
        /**
         * The wallet answered but accepted nothing. A finished, failed transfer: there is no
         * AddKey to run and the next two steps can only produce confusing errors, so the screens
         * must close them rather than let the user walk into that.
         */
        acceptedNothing: session.startOutput != null && !rows.some((row) => row.ok),
        /** Every accepted account is secured — the only state that may render as complete. */
        isFullySecured: session.phase === 'destination_keys_verified',
        /** Chain proof passed everywhere, but Meteor still owes completion on some account. */
        isAwaitingWalletCompletion: session.phase === 'verification_pending_wallet',
        /**
         * Once an AddKey intent is journaled the destination key may be live on-chain, so the SDK
         * fences `clear()` behind explicit revocation. Nothing may offer "start over" past here.
         */
        hasAddKeyIntent: (session.addKeyIntentAccounts || []).length > 0,
    };
};

/**
 * Transfers with nothing left to do never need resuming — and must not shadow a live one.
 * `verification_pending_wallet` is deliberately UNFINISHED: Meteor still owes completion work,
 * and the resume path (Check status) is how the user converges it.
 */
export const isNewKeyTransferFinished = (session) => {
    const summary = summarizeNewKeyTransferSession(session);
    return summary == null || summary.isFullySecured || summary.acceptedNothing;
};

/** The newest transfer with at least one secured account — the reload fallback for the
 * completion screen, which by definition no longer has work left to be "resumable" by. */
export const findSecuredNewKeyTransfer = (sessions) =>
    [...(sessions || [])]
        .reverse()
        .find(
            (session) => (summarizeNewKeyTransferSession(session)?.securedCount || 0) > 0
        );

/**
 * The transfer a screen reached without being told which one — after a reload, or from the
 * account list. The newest unfinished one, because the SDK keeps a list of transfers rather than
 * one slot and a finished transfer stays in it as a record.
 */
export const findResumableNewKeyTransfer = (sessions) =>
    [...(sessions || [])]
        .reverse()
        .find(
            (session) => session.startOutput != null && !isNewKeyTransferFinished(session)
        );

/**
 * Every public SDK error id this flow can surface, mapped to stable user copy.
 *
 * Falling back to the SDK's raw `Error.message` put machine-only strings such as
 * `new_key_transfer_add_key_account_mismatch` in front of users
 * (REVIEW-consumer-implementation M-03). The raw code is still returned separately, as a copyable
 * support detail — it is genuinely useful to support, and genuinely useless as primary copy.
 */
const ERROR_MESSAGE_KEYS = {
    new_key_transfer_unavailable: 'newKeyTransfer.error.unavailable',
    new_key_transfer_session_not_found: 'newKeyTransfer.error.sessionNotFound',
    new_key_transfer_no_accounts_ready: 'newKeyTransfer.error.noAccountsReady',
    new_key_transfer_start_result_journal_missing:
        'newKeyTransfer.error.startResultMissing',
    new_key_transfer_start_result_conflict: 'newKeyTransfer.error.startResultConflict',
    new_key_transfer_orphaned_add_key_recovery: 'newKeyTransfer.error.orphanedAddKey',
    new_key_transfer_recovery_required: 'newKeyTransfer.error.recoveryRequired',
    new_key_transfer_journal_corrupt: 'newKeyTransfer.error.journalCorrupt',
    new_key_transfer_wallet_binding_missing: 'newKeyTransfer.error.walletBindingMissing',
    new_key_transfer_client_id_conflict: 'newKeyTransfer.error.clientIdConflict',
    new_key_transfer_start_result_discard_failed:
        'newKeyTransfer.error.startResultDiscardFailed',
    new_key_transfer_verify_before_add_key_intent:
        'newKeyTransfer.error.verifyBeforeAddKeyIntent',
    new_key_transfer_add_key_account_mismatch:
        'newKeyTransfer.error.addKeyAccountMismatch',
    new_key_transfer_add_key_chain_required: 'newKeyTransfer.error.addKeyChainRequired',
    new_key_transfer_revoke_account_mismatch:
        'newKeyTransfer.error.revokeAccountMismatch',
    new_key_transfer_revoked_accounts_required:
        'newKeyTransfer.error.revokedAccountsRequired',
    new_key_transfer_revoke_chain_required: 'newKeyTransfer.error.revokeChainRequired',
    new_key_transfer_revoke_destination_key_present:
        'newKeyTransfer.error.revokeDestinationKeyPresent',
    // Stabilization SD11: the codes the SDK's typed surface added with the SD4 contract.
    new_key_transfer_wallet_connection_missing:
        'newKeyTransfer.error.walletConnectionMissing',
    new_key_transfer_start_result_referenced:
        'newKeyTransfer.error.startResultReferenced',
    new_key_transfer_journal_retention_required:
        'newKeyTransfer.error.journalRetentionRequired',
    new_key_transfer_verify_hash_mismatch: 'newKeyTransfer.error.verifyHashMismatch',
    new_key_transfer_verify_session_update_failed:
        'newKeyTransfer.error.verifySessionUpdateFailed',
    new_key_transfer_session_not_terminal: 'newKeyTransfer.error.sessionNotTerminal',
    // Raised by this wallet, not the SDK: the AddKey journal holds the exact proof Meteor must be
    // asked with, and a regenerated one is refused.
    new_key_transfer_verification_proof_missing:
        'newKeyTransfer.error.verificationProofMissing',
    // Raised by this wallet before the first AddKey: the whole selection is balance-checked so a
    // transfer never runs out of gas money halfway through its broadcasts.
    new_key_transfer_insufficient_balance_for_add_keys:
        'newKeyTransfer.error.insufficientBalanceForAddKeys',
};

/**
 * Codes whose only honest next step is the reconciliation screen.
 *
 * These are the global fence: resuming refuses because the binding record is gone, and starting
 * again refuses because the fence is global. Anything that offers "start again" here is offering
 * something the SDK guarantees will fail.
 */
const FENCED_ERROR_CODES = new Set([
    'new_key_transfer_orphaned_add_key_recovery',
    'new_key_transfer_recovery_required',
    'new_key_transfer_start_result_discard_failed',
    'new_key_transfer_journal_corrupt',
]);

/** Where a user should be sent to resolve a fenced transfer. */
export const NEW_KEY_TRANSFER_RECOVERY_ROUTE = '/export-accounts/new-key-recovery';

/**
 * The SDK's `AddKeyJournalError` codes, grouped by what a user can actually DO about each one
 * (stabilization SD11/MNW-11). The raw code still rides along for support; twenty separate
 * sentences would say less than these seven.
 */
const ADD_KEY_JOURNAL_ERROR_KEYS = {
    journal_unreadable: 'newKeyTransfer.journalError.unreadable',
    journal_unsupported_shape: 'newKeyTransfer.journalError.unreadable',
    start_result_corrupt: 'newKeyTransfer.journalError.unreadable',
    pending_verify_corrupt: 'newKeyTransfer.journalError.unreadable',
    journal_persist_failed: 'newKeyTransfer.journalError.persistFailed',
    start_result_persist_failed: 'newKeyTransfer.journalError.persistFailed',
    pending_verify_persist_failed: 'newKeyTransfer.journalError.persistFailed',
    start_result_clear_failed: 'newKeyTransfer.journalError.persistFailed',
    journal_duplicate_operations: 'newKeyTransfer.journalError.conflict',
    journal_operation_conflict: 'newKeyTransfer.journalError.conflict',
    journal_record_mismatch: 'newKeyTransfer.journalError.conflict',
    start_result_conflict: 'newKeyTransfer.journalError.conflict',
    pending_verify_conflict: 'newKeyTransfer.journalError.conflict',
    access_keys_malformed: 'newKeyTransfer.journalError.chainDataInvalid',
    signed_transaction_invalid: 'newKeyTransfer.journalError.chainDataInvalid',
    finalized_proof_invalid: 'newKeyTransfer.journalError.chainDataInvalid',
    destination_key_unproven: 'newKeyTransfer.journalError.destinationKeyUnproven',
    source_key_missing: 'newKeyTransfer.journalError.sourceKeyUnavailable',
    source_key_not_full_access: 'newKeyTransfer.journalError.sourceKeyUnavailable',
    broadcast_ambiguous: 'newKeyTransfer.journalError.broadcastAmbiguous',
};

/**
 * `{ i18nKey }` when the code is one we have words for, otherwise `{ fallback }`.
 *
 * `code` is always the raw SDK id and is meant to be rendered as fine print for support, never as
 * the sentence a user reads. `isFenced` says the only route forward is the reconciliation screen.
 */
export const describeNewKeyTransferError = (error) => {
    // AddKeyJournalError carries a typed `code` beside a host-neutral English message; the code,
    // not the message, is what this wallet localizes (MNW-11).
    if (error != null && error.name === 'AddKeyJournalError' && error.code != null) {
        const journalKey = ADD_KEY_JOURNAL_ERROR_KEYS[error.code];
        if (journalKey != null) {
            return { i18nKey: journalKey, code: error.code, isFenced: false };
        }
        return { fallback: error.message, code: error.code, isFenced: false };
    }
    const message = error instanceof Error ? error.message : String(error || '');
    const i18nKey = ERROR_MESSAGE_KEYS[message];
    const isFenced = FENCED_ERROR_CODES.has(message);
    return i18nKey
        ? { i18nKey, code: message, isFenced }
        : { fallback: message, code: message, isFenced };
};

/** Per-account refusal reasons Meteor may return from the start turn. */
export const newKeyTransferIssueKey = (issue) =>
    `newKeyTransfer.issue.${issue || 'unknown'}`;

/**
 * Why this wallet itself will not offer an account for transfer — decided locally, before Meteor
 * is asked anything. Shared by the account picker and the error the method screen shows when a
 * selected account turns out to be ineligible by the time the transfer starts.
 */
export const newKeyTransferEligibilityKey = (availability) => {
    switch (availability) {
        case 'verification_failed':
            return 'newKeyTransfer.eligibility.verificationFailed';
        case 'two_factor_unsupported':
            return 'newKeyTransfer.eligibility.twoFactorUnsupported';
        case 'ledger_unsupported':
            return 'newKeyTransfer.eligibility.ledgerUnsupported';
        case 'algorithm_unsupported':
            return 'newKeyTransfer.eligibility.algorithmUnsupported';
        case 'no_local_key':
            return 'newKeyTransfer.eligibility.noLocalKey';
        default:
            return 'newKeyTransfer.eligibility.notFullAccess';
    }
};

/** Per-account reasons Meteor may refuse an activation for. */
export const newKeyTransferActivationIssueKey = (issue) =>
    `newKeyTransfer.activationIssue.${issue || 'unknown'}`;

/**
 * One signed verify-turn row, mapped to the screen's per-account status vocabulary.
 *
 * Stabilization SD4: `secured` is the ONLY success. `verified_pending_completion` renders as
 * still-working with the exact outstanding fact — `import_incomplete` (Meteor has not finished
 * importing) or `liveness_check_failed` (the working-account test transfer failed; Check status
 * retries it). Anything else is a refusal with its issue.
 */
export const describeNewKeyTransferActivationRow = (row) => {
    if (row.activation === 'secured') {
        return {
            status: 'confirmed',
            /** SD13: whether Meteor additionally confirmed a real signed test transfer. */
            livenessConfirmed: row.liveness === 'confirmed',
        };
    }
    if (row.activation === 'verified_pending_completion') {
        return {
            status: 'pendingWallet',
            pendingKey:
                row.pendingFact === 'liveness_check_failed'
                    ? 'newKeyTransfer.pending.livenessCheckFailed'
                    : 'newKeyTransfer.pending.importIncomplete',
        };
    }
    return { status: 'failed', issue: row.issue };
};

/**
 * The durable id a start attempt replays with (stabilization SD7). Meteor journals its half of a
 * start under this id — a bridge/session expiry mid-confirmation costs nothing IF the retry
 * reuses the id, and mints a duplicate set of destination keys if it does not. The plan is pure;
 * the caller owns the storage read/write.
 *
 * `stored` is the previously stashed `{ clientTransferId, inputFingerprint }` or null;
 * `inputFingerprint` identifies the accounts+target this attempt is for.
 */
export const resolveNewKeyStartReplayPlan = ({ stored, inputFingerprint }) => {
    if (stored != null && stored.inputFingerprint === inputFingerprint) {
        // Same request as the interrupted attempt: replay its id, and skip the leftover-result
        // sweep — the wallet side may hold this very transfer mid-confirmation, and sweeping
        // would release the keys the replay is about to resume.
        return { clientTransferId: stored.clientTransferId, isReplay: true };
    }
    return { clientTransferId: undefined, isReplay: false };
};

/** A stable fingerprint of what a start attempt asks for, for replay matching only. */
export const newKeyStartInputFingerprint = ({ accounts, networkId, targetPlatform }) =>
    JSON.stringify({
        networkId,
        targetPlatform,
        accounts: [...accounts]
            .map(({ accountId, sourcePublicKey }) => `${accountId}::${sourcePublicKey}`)
            .sort(),
    });
