import { Mixpanel } from '../../mixpanel';

const EVENTS = {
    ENTRY_CLICKED: 'wallet_migration_entry_clicked',
    ACCOUNTS_SCANNED: 'wallet_migration_accounts_scanned',
    ACCOUNTS_SCAN_FAILED: 'wallet_migration_accounts_scan_failed',
    ACCOUNTS_SUBMITTED: 'wallet_migration_accounts_submitted',
    METHOD_SELECTED: 'wallet_migration_method_selected',
    NEW_KEY_PREPARE_STARTED: 'wallet_migration_new_key_prepare_started',
    NEW_KEY_PREPARE_SUCCEEDED: 'wallet_migration_new_key_prepare_succeeded',
    NEW_KEY_PREPARE_FAILED: 'wallet_migration_new_key_prepare_failed',
    ACTIVATION_REQUESTED: 'wallet_migration_activation_requested',
    ACTIVATION_STARTED: 'wallet_migration_activation_started',
    ACTIVATION_FINISHED: 'wallet_migration_activation_finished',
    ACTIVATION_FAILED: 'wallet_migration_activation_failed',
    NEW_KEY_COMPLETED: 'wallet_migration_new_key_completed',
    CLEANUP_SELECTED: 'wallet_migration_cleanup_selected',
    LOCAL_REMOVAL_SUCCEEDED: 'wallet_migration_local_removal_succeeded',
    LOCAL_REMOVAL_FAILED: 'wallet_migration_local_removal_failed',
    MANUAL_OPENED: 'wallet_migration_manual_opened',
    MANUAL_CREDENTIALS_LOADED: 'wallet_migration_manual_credentials_loaded',
    MANUAL_CREDENTIALS_FAILED: 'wallet_migration_manual_credentials_failed',
    MANUAL_PRIVATE_KEY_REVEALED: 'wallet_migration_manual_private_key_revealed',
    MANUAL_CREDENTIAL_COPIED: 'wallet_migration_manual_credential_copied',
    MANUAL_EXITED: 'wallet_migration_manual_exited',
};

const ELIGIBILITY_REASONS = [
    'no_local_key',
    'ledger_unsupported',
    'algorithm_unsupported',
    'two_factor_unsupported',
    'not_full_access',
    'verification_failed',
];

const REFUSAL_REASONS = [
    'account_not_found',
    'key_generation_failed',
    'pending_transfer_conflict',
    'rpc_lookup_failed',
    'secure_storage_failed',
    'source_key_not_found',
    'source_key_not_full_access',
];

const ACTIVATION_ISSUES = [
    'account_not_in_session',
    'activation_not_found',
    'activation_not_full_access',
    'invalid_add_key_transaction',
    'rpc_lookup_failed',
    'session_not_found',
    'source_signer_mismatch',
];

const KNOWN_ERROR_CODES = new Set([
    'new_key_transfer_unavailable',
    'new_key_transfer_session_not_found',
    'new_key_transfer_no_accounts_ready',
    'new_key_transfer_start_result_journal_missing',
    'new_key_transfer_start_result_conflict',
    'new_key_transfer_orphaned_add_key_recovery',
    'new_key_transfer_recovery_required',
    'new_key_transfer_journal_corrupt',
    'new_key_transfer_wallet_binding_missing',
    'new_key_transfer_client_id_conflict',
    'new_key_transfer_verification_proof_missing',
]);

const count = (items) => (Array.isArray(items) ? items.length : 0);

const track = (eventName, properties) => Mixpanel.track(eventName, properties);

const publicAccounts = (accounts) =>
    (accounts || [])
        .filter(({ accountId }) => typeof accountId === 'string')
        .map(({ accountId, sourcePublicKey, destinationPublicKey, publicKey }) => ({
            account_id: accountId,
            ...(typeof sourcePublicKey === 'string'
                ? { source_public_key: sourcePublicKey }
                : {}),
            ...(typeof destinationPublicKey === 'string'
                ? { destination_public_key: destinationPublicKey }
                : {}),
            ...(typeof publicKey === 'string' ? { public_key: publicKey } : {}),
        }));

const mergeAccountIdentity = (accounts, rows) => {
    const selectedById = new Map(
        (accounts || []).map((account) => [account.accountId, account])
    );
    return (rows || []).map((row) => ({
        ...(selectedById.get(row.accountId) || {}),
        accountId: row.accountId,
        ...(typeof row.destinationPublicKey === 'string'
            ? { destinationPublicKey: row.destinationPublicKey }
            : {}),
    }));
};

const reasonCounts = (items, reasonKey, allowedReasons, propertyPrefix) => {
    const allowed = new Set(allowedReasons);
    const counts = Object.fromEntries(
        allowedReasons.map((reason) => [`${propertyPrefix}_${reason}_count`, 0])
    );
    let unknownCount = 0;

    for (const item of items || []) {
        const reason = item?.[reasonKey];
        if (allowed.has(reason)) {
            counts[`${propertyPrefix}_${reason}_count`] += 1;
        } else {
            unknownCount += 1;
        }
    }

    return { ...counts, [`${propertyPrefix}_unknown_count`]: unknownCount };
};

export const safeMigrationErrorCode = (error) => {
    if (ELIGIBILITY_REASONS.includes(error?.availability)) {
        return `eligibility_${error.availability}`;
    }

    const message =
        error instanceof Error ? error.message : typeof error === 'string' ? error : '';
    if (KNOWN_ERROR_CODES.has(message)) {
        return message;
    }
    if (message.includes('does not have enough available NEAR')) {
        return 'insufficient_balance';
    }
    if (
        message.includes('source signing key') ||
        message.includes('selected source key')
    ) {
        return 'source_key_changed';
    }
    if (message.includes('No local key')) {
        return 'no_local_key';
    }

    return 'unknown';
};

export const trackMigrationEntryClicked = ({ entry, resumeStage }) =>
    track(EVENTS.ENTRY_CLICKED, {
        entry: entry === 'resume' ? 'resume' : 'start',
        ...(entry === 'resume'
            ? { resume_stage: resumeStage === 'activation' ? 'activation' : 'ready' }
            : {}),
    });

export const trackMigrationAccountsScanned = (accounts) => {
    const eligibleCount = (accounts || []).filter(
        ({ availability }) => availability === 'available'
    ).length;
    const unavailable = (accounts || []).filter(
        ({ availability }) => availability !== 'available'
    );
    track(EVENTS.ACCOUNTS_SCANNED, {
        total_count: count(accounts),
        eligible_count: eligibleCount,
        unavailable_count: unavailable.length,
        accounts: publicAccounts(accounts),
        ...reasonCounts(unavailable, 'availability', ELIGIBILITY_REASONS, 'unavailable'),
    });
};

export const trackMigrationAccountsScanFailed = (error) =>
    track(EVENTS.ACCOUNTS_SCAN_FAILED, {
        error_code: safeMigrationErrorCode(error),
    });

export const trackMigrationAccountsSubmitted = (accounts) =>
    track(EVENTS.ACCOUNTS_SUBMITTED, {
        selected_count: count(accounts),
        accounts: publicAccounts(accounts),
    });

export const trackMigrationMethodSelected = (method, accountIds) =>
    track(EVENTS.METHOD_SELECTED, {
        method: method === 'manual' ? 'manual' : 'new_key',
        account_ids: accountIds,
    });

export const trackNewKeyPrepareStarted = (accountIds) =>
    track(EVENTS.NEW_KEY_PREPARE_STARTED, {
        selected_count: count(accountIds),
        account_ids: accountIds,
    });

export const trackNewKeyPrepareSucceeded = ({ accounts, accepted, refused }) =>
    track(EVENTS.NEW_KEY_PREPARE_SUCCEEDED, {
        selected_count: count(accounts),
        accepted_count: count(accepted),
        refused_count: count(refused),
        accounts: publicAccounts(
            mergeAccountIdentity(accounts, [...(accepted || []), ...(refused || [])])
        ),
        ...reasonCounts(refused, 'issue', REFUSAL_REASONS, 'refused'),
    });

export const trackNewKeyPrepareFailed = ({ stage, error }) =>
    track(EVENTS.NEW_KEY_PREPARE_FAILED, {
        stage: stage === 'eligibility' ? 'eligibility' : 'meteor_start',
        error_code: safeMigrationErrorCode(error),
    });

export const trackMigrationActivationRequested = (accounts) =>
    track(EVENTS.ACTIVATION_REQUESTED, {
        account_count: count(accounts),
        accounts: publicAccounts(accounts),
    });

export const trackMigrationActivationStarted = ({ accounts }) =>
    track(EVENTS.ACTIVATION_STARTED, {
        account_count: count(accounts),
        accounts: publicAccounts(accounts),
    });

export const trackMigrationActivationFinished = ({ accounts, outputAccounts }) => {
    const failed = (outputAccounts || []).filter(
        ({ activation }) => activation !== 'verified'
    );
    track(EVENTS.ACTIVATION_FINISHED, {
        confirmed_count: count(outputAccounts) - failed.length,
        failed_count: failed.length,
        accounts: publicAccounts(mergeAccountIdentity(accounts, outputAccounts)),
        ...reasonCounts(failed, 'issue', ACTIVATION_ISSUES, 'activation_issue'),
    });
};

export const trackMigrationActivationFailed = ({ stage, error, statuses, accounts }) => {
    const values = Object.values(statuses || {});
    track(EVENTS.ACTIVATION_FAILED, {
        stage: stage === 'verification' ? 'verification' : 'add_keys',
        error_code: safeMigrationErrorCode(error),
        accounts: publicAccounts(accounts),
        confirmed_count: values.filter((status) => status === 'confirmed').length,
        added_count: values.filter((status) => status === 'added').length,
        failed_count: values.filter((status) => status === 'failed').length,
    });
};

export const trackNewKeyMigrationCompleted = ({ confirmed, unconfirmed }) =>
    track(EVENTS.NEW_KEY_COMPLETED, {
        confirmed_count: count(confirmed),
        unconfirmed_count: count(unconfirmed),
        accounts: publicAccounts([...(confirmed || []), ...(unconfirmed || [])]),
    });

export const trackMigrationCleanupSelected = ({ action, accounts }) =>
    track(EVENTS.CLEANUP_SELECTED, {
        action: action === 'remove' ? 'remove' : 'keep',
        account_count: count(accounts),
        accounts: publicAccounts(accounts),
    });

export const trackMigrationLocalRemovalSucceeded = ({ accountIds, remainingCount }) =>
    track(EVENTS.LOCAL_REMOVAL_SUCCEEDED, {
        removed_count: count(accountIds),
        remaining_count: remainingCount,
        account_ids: accountIds,
    });

export const trackMigrationLocalRemovalFailed = ({ accountIds, error }) =>
    track(EVENTS.LOCAL_REMOVAL_FAILED, {
        requested_count: count(accountIds),
        account_ids: accountIds,
        error_code: safeMigrationErrorCode(error),
    });

export const trackManualMigrationOpened = (accountIds) =>
    track(EVENTS.MANUAL_OPENED, {
        selected_count: count(accountIds),
        account_ids: accountIds,
    });

export const trackManualCredentialsLoaded = (accounts) =>
    track(EVENTS.MANUAL_CREDENTIALS_LOADED, {
        account_count: count(accounts),
        accounts: publicAccounts(accounts),
    });

export const trackManualCredentialsFailed = (error) =>
    track(EVENTS.MANUAL_CREDENTIALS_FAILED, {
        error_code: safeMigrationErrorCode(error),
    });

export const trackManualPrivateKeyRevealed = ({ account, selectedCount }) =>
    track(EVENTS.MANUAL_PRIVATE_KEY_REVEALED, {
        selected_count: selectedCount,
        accounts: publicAccounts([account]),
    });

export const trackManualCredentialCopied = ({ credentialType, account }) =>
    track(EVENTS.MANUAL_CREDENTIAL_COPIED, {
        credential_type: credentialType === 'private_key' ? 'private_key' : 'account_id',
        accounts: publicAccounts([account]),
    });

export const trackManualMigrationExited = (destination) =>
    track(EVENTS.MANUAL_EXITED, {
        destination: destination === 'method_selection' ? 'method_selection' : 'wallet',
    });

export { EVENTS as MIGRATION_ANALYTICS_EVENTS };
