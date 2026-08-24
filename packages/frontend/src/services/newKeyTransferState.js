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
 */
export const summarizeNewKeyTransferSession = (session) => {
    if (session == null) {
        return null;
    }
    const rows = session.startOutput?.accounts || [];
    const verified = new Set(session.verifiedAccounts || []);
    const accepted = rows
        .filter((row) => row.ok)
        .map((row) => ({
            accountId: row.accountId,
            networkId: row.networkId,
            destinationPublicKey: row.destinationPublicKey,
            isVerified: verified.has(newKeyTransferAccountIdentity(row)),
        }));

    return {
        clientTransferId: session.clientTransferId,
        transferSessionId: session.startOutput?.transferSessionId,
        targetPlatform: session.targetPlatform,
        phase: session.phase,
        accepted,
        refused: rows
            .filter((row) => !row.ok)
            .map((row) => ({ accountId: row.accountId, issue: row.issue })),
        /**
         * The wallet answered but accepted nothing. A finished, failed transfer: there is no
         * AddKey to run and the next two steps can only produce confusing errors, so the screens
         * must close them rather than let the user walk into that.
         */
        acceptedNothing: session.startOutput != null && !rows.some((row) => row.ok),
        isVerified: session.phase === 'destination_keys_verified',
        /**
         * Once an AddKey intent is journaled the destination key may be live on-chain, so the SDK
         * fences `clear()` behind explicit revocation. Nothing may offer "start over" past here.
         */
        hasAddKeyIntent: (session.addKeyIntentAccounts || []).length > 0,
    };
};

/** Transfers with nothing left to do never need resuming — and must not shadow a live one. */
export const isNewKeyTransferFinished = (session) => {
    const summary = summarizeNewKeyTransferSession(session);
    return summary == null || summary.isVerified || summary.acceptedNothing;
};

/**
 * The transfer a screen reached without being told which one — after a reload, or from the
 * account list. The newest unfinished one, because the SDK keeps a list of transfers rather than
 * one slot and a finished transfer stays in it as a record.
 */
export const findResumableNewKeyTransfer = (sessions) =>
    [...(sessions || [])]
        .reverse()
        .find((session) => session.startOutput != null && !isNewKeyTransferFinished(session));

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
    new_key_transfer_start_result_journal_missing: 'newKeyTransfer.error.startResultMissing',
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
    new_key_transfer_add_key_account_mismatch: 'newKeyTransfer.error.addKeyAccountMismatch',
    new_key_transfer_add_key_chain_required: 'newKeyTransfer.error.addKeyChainRequired',
    new_key_transfer_revoke_account_mismatch: 'newKeyTransfer.error.revokeAccountMismatch',
    new_key_transfer_revoked_accounts_required: 'newKeyTransfer.error.revokedAccountsRequired',
    new_key_transfer_revoke_chain_required: 'newKeyTransfer.error.revokeChainRequired',
    new_key_transfer_revoke_destination_key_present:
        'newKeyTransfer.error.revokeDestinationKeyPresent',
    // Raised by this wallet, not the SDK: the AddKey journal holds the exact proof Meteor must be
    // asked with, and a regenerated one is refused.
    new_key_transfer_verification_proof_missing:
        'newKeyTransfer.error.verificationProofMissing',
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
 * `{ i18nKey }` when the code is one we have words for, otherwise `{ fallback }`.
 *
 * `code` is always the raw SDK id and is meant to be rendered as fine print for support, never as
 * the sentence a user reads. `isFenced` says the only route forward is the reconciliation screen.
 */
export const describeNewKeyTransferError = (error) => {
    const message = error instanceof Error ? error.message : String(error || '');
    const i18nKey = ERROR_MESSAGE_KEYS[message];
    const isFenced = FENCED_ERROR_CODES.has(message);
    return i18nKey
        ? { i18nKey, code: message, isFenced }
        : { fallback: message, code: message, isFenced };
};

/** Per-account refusal reasons Meteor may return from the start turn. */
export const newKeyTransferIssueKey = (issue) => `newKeyTransfer.issue.${issue || 'unknown'}`;

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
