import { Mixpanel } from '../../mixpanel';
import CONFIG from '../../config';
import {
    describeNewKeyTransferActivationRow,
    safeNewKeyTransferErrorCode,
} from '../../services/newKeyTransferState';

const EVENTS = {
    ENTRY_CLICKED: 'wallet_migration_entry_clicked',
    ACCOUNTS_SCANNED: 'wallet_migration_accounts_scanned',
    ACCOUNTS_SCAN_FAILED: 'wallet_migration_accounts_scan_failed',
    ACCOUNT_SELECTED: 'wallet_migration_account_selected',
    ACCOUNT_DESELECTED: 'wallet_migration_account_deselected',
    ACCOUNT_SELECTION_CANCELLED: 'wallet_migration_account_selection_cancelled',
    ACCOUNTS_SUBMITTED: 'wallet_migration_accounts_submitted',
    METHOD_SELECTED: 'wallet_migration_method_selected',
    METHOD_EXITED: 'wallet_migration_method_exited',
    NEW_KEY_PREPARE_STARTED: 'wallet_migration_new_key_prepare_started',
    NEW_KEY_PREPARE_SUCCEEDED: 'wallet_migration_new_key_prepare_succeeded',
    NEW_KEY_PREPARE_FAILED: 'wallet_migration_new_key_prepare_failed',
    NEW_KEY_PREPARE_ALL_REFUSED: 'wallet_migration_new_key_prepare_all_refused',
    PENDING_START_DISCARD_REQUESTED: 'wallet_migration_pending_start_discard_requested',
    PENDING_START_DISCARD_SUCCEEDED: 'wallet_migration_pending_start_discard_succeeded',
    PENDING_START_DISCARD_FAILED: 'wallet_migration_pending_start_discard_failed',
    ACTIVATION_REQUESTED: 'wallet_migration_activation_requested',
    ACTIVATION_STARTED: 'wallet_migration_activation_started',
    ACTIVATION_FINISHED: 'wallet_migration_activation_finished',
    ACTIVATION_FAILED: 'wallet_migration_activation_failed',
    VERIFICATION_REQUESTED: 'wallet_migration_verification_requested',
    VERIFICATION_STARTED: 'wallet_migration_verification_started',
    VERIFICATION_FINISHED: 'wallet_migration_verification_finished',
    VERIFICATION_FAILED: 'wallet_migration_verification_failed',
    CHECK_STATUS_REQUESTED: 'wallet_migration_check_status_requested',
    CHECK_STATUS_OPENED: 'wallet_migration_check_status_opened',
    NEW_KEY_COMPLETED: 'wallet_migration_new_key_completed',
    START_USING_METEOR_CLICKED: 'wallet_migration_start_using_meteor_clicked',
    DONE_CLICKED: 'wallet_migration_done_clicked',
    VIEW_SECURED_CLICKED: 'wallet_migration_view_secured_clicked',
    START_OVER_PROMPTED: 'wallet_migration_start_over_prompted',
    START_OVER_CANCELLED: 'wallet_migration_start_over_cancelled',
    START_OVER_REQUESTED: 'wallet_migration_start_over_requested',
    START_OVER_SUCCEEDED: 'wallet_migration_start_over_succeeded',
    START_OVER_FAILED: 'wallet_migration_start_over_failed',
    ENTRY_LOAD_FAILED: 'wallet_migration_entry_load_failed',
    SESSION_LOAD_FAILED: 'wallet_migration_session_load_failed',
    SESSION_REDIRECTED: 'wallet_migration_session_redirected',
    RECOVERY_REPORT_LOADED: 'wallet_migration_recovery_report_loaded',
    RECOVERY_REPORT_FAILED: 'wallet_migration_recovery_report_failed',
    RECOVERY_CHECK_REQUESTED: 'wallet_migration_recovery_check_requested',
    RECOVERY_CHECK_FINISHED: 'wallet_migration_recovery_check_finished',
    RECOVERY_CHECK_FAILED: 'wallet_migration_recovery_check_failed',
    RECOVERY_REVOKE_REQUESTED: 'wallet_migration_recovery_revoke_requested',
    RECOVERY_REVOKE_SUCCEEDED: 'wallet_migration_recovery_revoke_succeeded',
    RECOVERY_REVOKE_FAILED: 'wallet_migration_recovery_revoke_failed',
    RECOVERY_ARCHIVE_REQUESTED: 'wallet_migration_recovery_archive_requested',
    RECOVERY_ARCHIVE_SUCCEEDED: 'wallet_migration_recovery_archive_succeeded',
    RECOVERY_ARCHIVE_FAILED: 'wallet_migration_recovery_archive_failed',
    RECOVERY_RESOLVED: 'wallet_migration_recovery_resolved',
    RECOVERY_FINISH_LATER: 'wallet_migration_recovery_finish_later',
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
    'not_funded',
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

const count = (items) => (Array.isArray(items) ? items.length : 0);

const migrationNetworkId =
    CONFIG.CURRENT_NEAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';

const track = (eventName, properties = {}) =>
    Mixpanel.track(eventName, { network_id: migrationNetworkId, ...properties });

const transferProperties = (transfer, operation = {}) => ({
    ...(transfer?.clientTransferId != null
        ? { client_transfer_id: transfer.clientTransferId }
        : {}),
    ...(transfer?.transferSessionId != null
        ? { transfer_session_id: transfer.transferSessionId }
        : transfer?.startOutput?.transferSessionId != null
        ? { transfer_session_id: transfer.startOutput.transferSessionId }
        : {}),
    ...(Array.isArray(transfer?.accepted)
        ? { account_count: transfer.accepted.length }
        : Array.isArray(transfer?.startOutput?.accounts)
        ? {
              account_count: transfer.startOutput.accounts.filter((row) => row.ok).length,
          }
        : {}),
    ...(operation.attemptNumber != null
        ? { attempt_number: operation.attemptNumber }
        : {}),
    ...(operation.isResume != null ? { is_resume: operation.isResume } : {}),
    ...(operation.durationMs != null ? { duration_ms: operation.durationMs } : {}),
});

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

    const knownNewKeyCode = safeNewKeyTransferErrorCode(error);
    if (knownNewKeyCode != null) {
        return knownNewKeyCode;
    }
    const message =
        error instanceof Error ? error.message : typeof error === 'string' ? error : '';
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
        ...(entry === 'resume' ? { resume_stage: resumeStage } : {}),
    });

export const trackMigrationEntryLoadFailed = (error) =>
    track(EVENTS.ENTRY_LOAD_FAILED, { error_code: safeMigrationErrorCode(error) });

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

export const trackMigrationAccountSelectionChanged = ({ account, selected }) =>
    track(selected ? EVENTS.ACCOUNT_SELECTED : EVENTS.ACCOUNT_DESELECTED, {
        accounts: publicAccounts([account]),
    });

export const trackMigrationAccountSelectionCancelled = ({ selectedCount }) =>
    track(EVENTS.ACCOUNT_SELECTION_CANCELLED, { selected_count: selectedCount });

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

export const trackMigrationMethodExited = (accountIds) =>
    track(EVENTS.METHOD_EXITED, {
        selected_count: count(accountIds),
        account_ids: accountIds,
    });

export const trackNewKeyPrepareStarted = (accountIds, operation) =>
    track(EVENTS.NEW_KEY_PREPARE_STARTED, {
        selected_count: count(accountIds),
        account_ids: accountIds,
        ...transferProperties(undefined, operation),
    });

export const trackNewKeyPrepareSucceeded = ({
    accounts,
    accepted,
    refused,
    session,
    ...operation
}) =>
    track(EVENTS.NEW_KEY_PREPARE_SUCCEEDED, {
        selected_count: count(accounts),
        accepted_count: count(accepted),
        refused_count: count(refused),
        accounts: publicAccounts(
            mergeAccountIdentity(accounts, [...(accepted || []), ...(refused || [])])
        ),
        ...reasonCounts(refused, 'issue', REFUSAL_REASONS, 'refused'),
        ...transferProperties(session, operation),
    });

export const trackNewKeyPrepareFailed = ({ stage, error, ...operation }) =>
    track(EVENTS.NEW_KEY_PREPARE_FAILED, {
        stage: stage === 'eligibility' ? 'eligibility' : 'meteor_start',
        error_code: safeMigrationErrorCode(error),
        ...transferProperties(undefined, operation),
    });

export const trackNewKeyPrepareAllRefused = ({ session, refused, ...operation }) =>
    track(EVENTS.NEW_KEY_PREPARE_ALL_REFUSED, {
        refused_count: count(refused),
        ...reasonCounts(refused, 'issue', REFUSAL_REASONS, 'refused'),
        ...transferProperties(session, operation),
    });

export const trackPendingStartDiscardRequested = (operation) =>
    track(
        EVENTS.PENDING_START_DISCARD_REQUESTED,
        transferProperties(undefined, operation)
    );

export const trackPendingStartDiscardSucceeded = (operation) =>
    track(
        EVENTS.PENDING_START_DISCARD_SUCCEEDED,
        transferProperties(undefined, operation)
    );

export const trackPendingStartDiscardFailed = ({ error, ...operation }) =>
    track(EVENTS.PENDING_START_DISCARD_FAILED, {
        error_code: safeMigrationErrorCode(error),
        ...transferProperties(undefined, operation),
    });

export const trackMigrationActivationRequested = ({ accounts, summary, ...operation }) =>
    track(EVENTS.ACTIVATION_REQUESTED, {
        account_count: count(accounts),
        accounts: publicAccounts(accounts),
        ...transferProperties(summary, operation),
    });

export const trackMigrationActivationStarted = ({ accounts, summary, ...operation }) =>
    track(EVENTS.ACTIVATION_STARTED, {
        account_count: count(accounts),
        accounts: publicAccounts(accounts),
        ...transferProperties(summary, operation),
    });

export const trackMigrationActivationFinished = ({ accounts, summary, ...operation }) =>
    track(EVENTS.ACTIVATION_FINISHED, {
        activated_count: count(accounts),
        accounts: publicAccounts(accounts),
        ...transferProperties(summary, operation),
    });

export const trackMigrationActivationFailed = ({
    error,
    statuses,
    accounts,
    summary,
    ...operation
}) => {
    const values = Object.values(statuses || {});
    track(EVENTS.ACTIVATION_FAILED, {
        error_code: safeMigrationErrorCode(error),
        accounts: publicAccounts(accounts),
        confirmed_count: values.filter((status) => status === 'confirmed').length,
        added_count: values.filter((status) => status === 'added').length,
        failed_count: values.filter((status) => status === 'failed').length,
        ...transferProperties(summary, operation),
    });
};

export const trackMigrationVerificationRequested = ({
    accounts,
    summary,
    ...operation
}) =>
    track(EVENTS.VERIFICATION_REQUESTED, {
        account_count: count(accounts),
        accounts: publicAccounts(accounts),
        ...transferProperties(summary, operation),
    });

export const trackMigrationCheckStatusRequested = ({ accounts, summary, ...operation }) =>
    track(EVENTS.CHECK_STATUS_REQUESTED, {
        account_count: count(accounts),
        accounts: publicAccounts(accounts),
        ...transferProperties(summary, operation),
    });

export const trackMigrationCheckStatusOpened = (summary) =>
    track(EVENTS.CHECK_STATUS_OPENED, transferProperties(summary));

export const trackMigrationVerificationStarted = ({ accounts, summary, ...operation }) =>
    track(EVENTS.VERIFICATION_STARTED, {
        account_count: count(accounts),
        accounts: publicAccounts(accounts),
        ...transferProperties(summary, operation),
    });

export const trackMigrationVerificationFinished = ({
    accounts,
    outputAccounts,
    summary,
    ...operation
}) => {
    const described = (outputAccounts || []).map((row) => ({
        ...row,
        analyticsStatus: describeNewKeyTransferActivationRow(row).status,
    }));
    const secured = described.filter(
        ({ analyticsStatus }) => analyticsStatus === 'confirmed'
    );
    const pending = described.filter(
        ({ analyticsStatus }) => analyticsStatus === 'pendingWallet'
    );
    const failed = described.filter(
        ({ analyticsStatus }) => analyticsStatus === 'failed'
    );
    track(EVENTS.VERIFICATION_FINISHED, {
        secured_count: secured.length,
        pending_wallet_count: pending.length,
        failed_count: failed.length,
        accounts: publicAccounts(mergeAccountIdentity(accounts, outputAccounts)),
        ...reasonCounts(failed, 'issue', ACTIVATION_ISSUES, 'activation_issue'),
        ...transferProperties(summary, operation),
    });
};

export const trackMigrationVerificationFailed = ({
    error,
    statuses,
    accounts,
    summary,
    ...operation
}) => {
    const values = Object.values(statuses || {});
    track(EVENTS.VERIFICATION_FAILED, {
        error_code: safeMigrationErrorCode(error),
        accounts: publicAccounts(accounts),
        secured_count: values.filter((status) => status === 'confirmed').length,
        pending_wallet_count: values.filter((status) => status === 'pendingWallet')
            .length,
        failed_count: values.filter((status) => status === 'failed').length,
        ...transferProperties(summary, operation),
    });
};

export const trackNewKeyMigrationCompleted = ({ confirmed, unconfirmed, summary }) =>
    track(EVENTS.NEW_KEY_COMPLETED, {
        confirmed_count: count(confirmed),
        unconfirmed_count: count(unconfirmed),
        accounts: publicAccounts([...(confirmed || []), ...(unconfirmed || [])]),
        ...transferProperties(summary),
        ...(summary?.clientTransferId
            ? {
                  $insert_id: summary.clientTransferId,
              }
            : {}),
    });

export const trackMigrationStartUsingMeteorClicked = (summary) =>
    track(EVENTS.START_USING_METEOR_CLICKED, transferProperties(summary));

export const trackMigrationDoneClicked = (summary) =>
    track(EVENTS.DONE_CLICKED, transferProperties(summary));

export const trackMigrationViewSecuredClicked = (summary) =>
    track(EVENTS.VIEW_SECURED_CLICKED, {
        secured_count: summary?.securedCount || 0,
        ...transferProperties(summary),
    });

export const trackMigrationStartOverPrompted = (summary) =>
    track(EVENTS.START_OVER_PROMPTED, transferProperties(summary));

export const trackMigrationStartOverCancelled = (summary) =>
    track(EVENTS.START_OVER_CANCELLED, transferProperties(summary));

export const trackMigrationStartOverRequested = ({ summary, ...operation }) =>
    track(EVENTS.START_OVER_REQUESTED, transferProperties(summary, operation));

export const trackMigrationStartOverSucceeded = ({ summary, ...operation }) =>
    track(EVENTS.START_OVER_SUCCEEDED, transferProperties(summary, operation));

export const trackMigrationStartOverFailed = ({ summary, error, ...operation }) =>
    track(EVENTS.START_OVER_FAILED, {
        error_code: safeMigrationErrorCode(error),
        ...transferProperties(summary, operation),
    });

export const trackMigrationSessionLoadFailed = ({ error, requestedId, durationMs }) =>
    track(EVENTS.SESSION_LOAD_FAILED, {
        error_code: safeMigrationErrorCode(error),
        ...(requestedId != null ? { client_transfer_id: requestedId } : {}),
        duration_ms: durationMs,
    });

export const trackMigrationSessionRedirected = ({ destination, summary }) =>
    track(EVENTS.SESSION_REDIRECTED, {
        destination,
        ...transferProperties(summary),
    });

export const trackMigrationRecoveryReportLoaded = ({ report, durationMs }) =>
    track(EVENTS.RECOVERY_REPORT_LOADED, {
        fenced: report?.fenced === true,
        operation_count: count(report?.operations),
        duration_ms: durationMs,
    });

export const trackMigrationRecoveryReportFailed = ({ error, durationMs }) =>
    track(EVENTS.RECOVERY_REPORT_FAILED, {
        error_code: safeMigrationErrorCode(error),
        duration_ms: durationMs,
    });

const recoveryOperationProperties = (operation, extra = {}) => ({
    client_transfer_id: operation.clientTransferId,
    transfer_session_id: operation.transferSessionId,
    account_id: operation.accountId,
    account_count: 1,
    ...extra,
});

export const trackMigrationRecoveryCheckRequested = ({ operation, ...extra }) =>
    track(EVENTS.RECOVERY_CHECK_REQUESTED, recoveryOperationProperties(operation, extra));

export const trackMigrationRecoveryCheckFinished = ({ operation, result, ...extra }) =>
    track(
        EVENTS.RECOVERY_CHECK_FINISHED,
        recoveryOperationProperties(operation, {
            result_status: result.status,
            ...(result.detail != null ? { result_detail: result.detail } : {}),
            ...extra,
        })
    );

export const trackMigrationRecoveryCheckFailed = ({ operation, error, ...extra }) =>
    track(
        EVENTS.RECOVERY_CHECK_FAILED,
        recoveryOperationProperties(operation, {
            error_code: safeMigrationErrorCode(error),
            ...extra,
        })
    );

export const trackMigrationRecoveryRevokeRequested = ({ operation, ...extra }) =>
    track(
        EVENTS.RECOVERY_REVOKE_REQUESTED,
        recoveryOperationProperties(operation, extra)
    );

export const trackMigrationRecoveryRevokeSucceeded = ({ operation, ...extra }) =>
    track(
        EVENTS.RECOVERY_REVOKE_SUCCEEDED,
        recoveryOperationProperties(operation, extra)
    );

export const trackMigrationRecoveryRevokeFailed = ({ operation, error, ...extra }) =>
    track(
        EVENTS.RECOVERY_REVOKE_FAILED,
        recoveryOperationProperties(operation, {
            error_code: safeMigrationErrorCode(error),
            ...extra,
        })
    );

export const trackMigrationRecoveryArchiveRequested = ({ operation, ...extra }) =>
    track(
        EVENTS.RECOVERY_ARCHIVE_REQUESTED,
        recoveryOperationProperties(operation, extra)
    );

export const trackMigrationRecoveryArchiveSucceeded = ({ operation, ...extra }) =>
    track(
        EVENTS.RECOVERY_ARCHIVE_SUCCEEDED,
        recoveryOperationProperties(operation, extra)
    );

export const trackMigrationRecoveryArchiveFailed = ({
    operation,
    error,
    errorCode,
    ...extra
}) =>
    track(
        EVENTS.RECOVERY_ARCHIVE_FAILED,
        recoveryOperationProperties(operation, {
            error_code: errorCode || safeMigrationErrorCode(error),
            ...extra,
        })
    );

export const trackMigrationRecoveryResolved = () => track(EVENTS.RECOVERY_RESOLVED);

export const trackMigrationRecoveryFinishLater = ({ operationCount }) =>
    track(EVENTS.RECOVERY_FINISH_LATER, { operation_count: operationCount });

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
