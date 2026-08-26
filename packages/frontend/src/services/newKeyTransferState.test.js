import {
    describeNewKeyTransferActivationRow,
    describeNewKeyTransferError,
    findResumableNewKeyTransfer,
    findSecuredNewKeyTransfer,
    isNewKeyTransferFinished,
    newKeyStartInputFingerprint,
    newKeyTransferAccountIdentity,
    newKeyTransferEligibilityKey,
    resolveNewKeyStartOverPlan,
    resolveNewKeyStartReplayPlan,
    summarizeNewKeyTransferSession,
} from './newKeyTransferState';

const identity = (accountId) => `near::testnet::${accountId}`;

const readyRow = (accountId) => ({
    blockchainId: 'near',
    networkId: 'testnet',
    accountId,
    ok: true,
    destinationSignerType: 'seed_phrase',
    destinationPublicKey: 'ed25519:CktRuQ2mttgRGkXJtyksdKHjUdc2C4TgDzyB98oEzy8',
});

const refusedRow = (accountId, issue) => ({
    blockchainId: 'near',
    networkId: 'testnet',
    accountId,
    ok: false,
    issue,
});

const makeSession = ({
    clientTransferId = 'transfer-1',
    phase = 'destination_keys_staged',
    accounts = [readyRow('alice.testnet')],
    addKeyIntentAccounts = [],
    verifiedAccounts = [],
    withStartOutput = true,
} = {}) => ({
    formatVersion: 1,
    phase,
    targetPlatform: 'web',
    clientTransferId,
    canonicalInputHash: 'hash',
    startRequest: { formatVersion: 1, clientTransferId, accounts: [] },
    startOutput: withStartOutput
        ? {
              formatVersion: 1,
              clientTransferId,
              transferSessionId: `${clientTransferId}-session`,
              accounts,
          }
        : undefined,
    addKeyIntentAccounts,
    verifiedAccounts,
    updatedAt: 1,
});

describe('newKeyTransferAccountIdentity', () => {
    it('matches the protocol format the SDK journals accounts under', () => {
        expect(
            newKeyTransferAccountIdentity({
                blockchainId: 'near',
                networkId: 'testnet',
                accountId: 'alice.testnet',
            })
        ).toBe('near::testnet::alice.testnet');
    });
});

describe('summarizeNewKeyTransferSession', () => {
    it('splits accepted from refused accounts and keeps the refusal reason', () => {
        const summary = summarizeNewKeyTransferSession(
            makeSession({
                accounts: [
                    readyRow('alice.testnet'),
                    refusedRow('bob.testnet', 'pending_transfer_conflict'),
                ],
            })
        );

        expect(summary.accepted.map((account) => account.accountId)).toEqual([
            'alice.testnet',
        ]);
        expect(summary.refused).toEqual([
            { accountId: 'bob.testnet', issue: 'pending_transfer_conflict' },
        ]);
        expect(summary.acceptedNothing).toBe(false);
    });

    it('marks each accepted account against the journal of verified identities', () => {
        const summary = summarizeNewKeyTransferSession(
            makeSession({
                accounts: [readyRow('alice.testnet'), readyRow('bob.testnet')],
                verifiedAccounts: [identity('alice.testnet')],
            })
        );

        expect(summary.accepted.map((account) => account.isVerified)).toEqual([
            true,
            false,
        ]);
    });

    it('reports a transfer the wallet accepted nothing for', () => {
        const summary = summarizeNewKeyTransferSession(
            makeSession({ accounts: [refusedRow('alice.testnet', 'account_not_found')] })
        );

        expect(summary.acceptedNothing).toBe(true);
        expect(summary.accepted).toEqual([]);
    });

    it('does not call a start-pending transfer "accepted nothing"', () => {
        // No start output at all is "the wallet has not answered", which is a different
        // situation from "the wallet answered and refused everything".
        const summary = summarizeNewKeyTransferSession(
            makeSession({ phase: 'start_pending', withStartOutput: false })
        );

        expect(summary.acceptedNothing).toBe(false);
        expect(summary.transferSessionId).toBeUndefined();
    });

    it('flags a journaled AddKey intent, which is what fences discarding a transfer', () => {
        expect(summarizeNewKeyTransferSession(makeSession()).hasAddKeyIntent).toBe(false);
        expect(
            summarizeNewKeyTransferSession(
                makeSession({
                    phase: 'add_key_in_progress',
                    addKeyIntentAccounts: [identity('alice.testnet')],
                })
            ).hasAddKeyIntent
        ).toBe(true);
    });
});

describe('isNewKeyTransferFinished', () => {
    it('counts a fully verified transfer as finished', () => {
        expect(
            isNewKeyTransferFinished(
                makeSession({
                    phase: 'destination_keys_verified',
                    addKeyIntentAccounts: [identity('alice.testnet')],
                    verifiedAccounts: [identity('alice.testnet')],
                })
            )
        ).toBe(true);
    });

    it('counts a transfer nothing was accepted for as finished', () => {
        expect(
            isNewKeyTransferFinished(
                makeSession({
                    accounts: [refusedRow('alice.testnet', 'account_not_found')],
                })
            )
        ).toBe(true);
    });

    it('counts a transfer with keys still to add as unfinished', () => {
        expect(isNewKeyTransferFinished(makeSession())).toBe(false);
    });
});

describe('findResumableNewKeyTransfer', () => {
    it('picks the newest transfer that still has work left', () => {
        const finished = makeSession({
            clientTransferId: 'old',
            phase: 'destination_keys_verified',
            addKeyIntentAccounts: [identity('alice.testnet')],
            verifiedAccounts: [identity('alice.testnet')],
        });
        const pending = makeSession({ clientTransferId: 'new' });

        expect(findResumableNewKeyTransfer([finished, pending]).clientTransferId).toBe(
            'new'
        );
    });

    it('ignores a transfer the wallet has not answered yet', () => {
        // Nothing was minted, so there is no destination key to activate and nothing to resume.
        expect(
            findResumableNewKeyTransfer([
                makeSession({ phase: 'start_pending', withStartOutput: false }),
            ])
        ).toBeUndefined();
    });

    it('returns nothing when every transfer is finished', () => {
        expect(
            findResumableNewKeyTransfer([
                makeSession({
                    accounts: [refusedRow('alice.testnet', 'rpc_lookup_failed')],
                }),
            ])
        ).toBeUndefined();
    });
});

describe('describeNewKeyTransferError', () => {
    it('maps a known SDK code to a translation key, and keeps the code for support', () => {
        // REVIEW-consumer-implementation M-03: the raw id is still returned, but only as a
        // copyable support detail — never as the sentence a user reads.
        expect(
            describeNewKeyTransferError(
                new Error('new_key_transfer_start_result_journal_missing')
            )
        ).toEqual({
            i18nKey: 'newKeyTransfer.error.startResultMissing',
            code: 'new_key_transfer_start_result_journal_missing',
            isFenced: false,
        });
    });

    it('maps every public SDK error id the flow can raise', () => {
        // These six reached the UI as raw machine strings before M-03.
        const codes = [
            'new_key_transfer_start_result_discard_failed',
            'new_key_transfer_verify_before_add_key_intent',
            'new_key_transfer_add_key_account_mismatch',
            'new_key_transfer_add_key_chain_required',
            'new_key_transfer_revoke_account_mismatch',
            'new_key_transfer_revoked_accounts_required',
        ];
        for (const code of codes) {
            const described = describeNewKeyTransferError(new Error(code));
            expect(described.i18nKey).toBeTruthy();
            expect(described.fallback).toBeUndefined();
        }
    });

    it('flags the codes whose only route forward is reconciliation', () => {
        // Offering "start again" for these is offering something the SDK guarantees will fail.
        expect(
            describeNewKeyTransferError(
                new Error('new_key_transfer_orphaned_add_key_recovery')
            ).isFenced
        ).toBe(true);
        expect(
            describeNewKeyTransferError(new Error('new_key_transfer_journal_corrupt'))
                .isFenced
        ).toBe(true);
        expect(
            describeNewKeyTransferError(new Error('new_key_transfer_session_not_found'))
                .isFenced
        ).toBe(false);
    });

    it('passes an unmapped message through so the SDK can speak for itself', () => {
        // The AddKey journal writes its own messages for a human to act on; replacing them with
        // a generic string would throw away the only recovery instruction the user gets.
        const message =
            'alice.testnet exact signed AddKey transaction is saved, but broadcast is ambiguous.';
        expect(describeNewKeyTransferError(new Error(message))).toEqual({
            fallback: message,
            code: message,
            isFenced: false,
        });
    });
});

describe('newKeyTransferEligibilityKey', () => {
    it('names the reason this wallet will not offer an account', () => {
        expect(newKeyTransferEligibilityKey('verification_failed')).toBe(
            'newKeyTransfer.eligibility.verificationFailed'
        );
        expect(newKeyTransferEligibilityKey('ledger_unsupported')).toBe(
            'newKeyTransfer.eligibility.ledgerUnsupported'
        );
    });

    it('falls back to the not-full-access reason for anything unrecognised', () => {
        expect(newKeyTransferEligibilityKey('something_new')).toBe(
            'newKeyTransfer.eligibility.notFullAccess'
        );
    });
});

describe('stabilization SD4/SD6 readers', () => {
    const securedSession = (overrides = {}) =>
        makeSession({
            phase: 'verification_pending_wallet',
            accounts: [readyRow('alice.testnet'), readyRow('bob.testnet')],
            addKeyIntentAccounts: [identity('alice.testnet'), identity('bob.testnet')],
            verifiedAccounts: [identity('alice.testnet'), identity('bob.testnet')],
            ...overrides,
        });

    it('splits verified into secured and pending-completion, and never rounds pending up', () => {
        const session = securedSession();
        session.securedAccounts = [identity('alice.testnet')];
        session.pendingCompletionAccounts = [identity('bob.testnet')];
        const summary = summarizeNewKeyTransferSession(session);
        const alice = summary.accepted.find((row) => row.accountId === 'alice.testnet');
        const bob = summary.accepted.find((row) => row.accountId === 'bob.testnet');
        expect(alice).toMatchObject({
            isVerified: true,
            isSecured: true,
            isPendingCompletion: false,
        });
        expect(bob).toMatchObject({
            isVerified: true,
            isSecured: false,
            isPendingCompletion: true,
        });
        expect(summary.securedCount).toBe(1);
        expect(summary.pendingCompletionCount).toBe(1);
        expect(summary.isFullySecured).toBe(false);
        expect(summary.isAwaitingWalletCompletion).toBe(true);
    });

    it('keeps a pending-wallet transfer UNFINISHED so resume and Check status stay offered', () => {
        const session = securedSession();
        session.securedAccounts = [identity('alice.testnet')];
        session.pendingCompletionAccounts = [identity('bob.testnet')];
        expect(isNewKeyTransferFinished(session)).toBe(false);
        expect(findResumableNewKeyTransfer([session])).toBe(session);
    });

    it('joins the start request so each accepted row carries its exact source key', () => {
        const session = makeSession();
        session.startRequest.accounts = [
            {
                blockchainId: 'near',
                networkId: 'testnet',
                accountId: 'alice.testnet',
                sourcePublicKey: 'ed25519:4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi',
            },
        ];
        const summary = summarizeNewKeyTransferSession(session);
        expect(summary.accepted[0].sourcePublicKey).toBe(
            'ed25519:4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi'
        );
    });

    it('finds the newest transfer with a secured account for the completion screen fallback', () => {
        const finished = securedSession({ clientTransferId: 'transfer-finished' });
        finished.securedAccounts = [identity('alice.testnet'), identity('bob.testnet')];
        finished.phase = 'destination_keys_verified';
        const failedLater = makeSession({
            clientTransferId: 'transfer-failed-later',
            accounts: [refusedRow('carol.testnet', 'account_not_found')],
        });
        // The raw latest session is the failed one; the completion screen must find the transfer
        // the user actually finished (MNW-4).
        expect(findSecuredNewKeyTransfer([finished, failedLater])).toBe(finished);
        expect(findSecuredNewKeyTransfer([failedLater])).toBeUndefined();
    });
});

describe('describeNewKeyTransferActivationRow', () => {
    it('treats secured as the only success and carries the SD13 liveness fact', () => {
        expect(
            describeNewKeyTransferActivationRow({
                activation: 'secured',
                liveness: 'confirmed',
            })
        ).toEqual({ status: 'confirmed', livenessConfirmed: true });
        expect(
            describeNewKeyTransferActivationRow({
                activation: 'secured',
                liveness: 'skipped',
            })
        ).toEqual({ status: 'confirmed', livenessConfirmed: false });
    });

    it('renders each pending completion fact with its own next step', () => {
        expect(
            describeNewKeyTransferActivationRow({
                activation: 'verified_pending_completion',
                pendingFact: 'import_incomplete',
            })
        ).toEqual({
            status: 'pendingWallet',
            pendingKey: 'newKeyTransfer.pending.importIncomplete',
        });
        expect(
            describeNewKeyTransferActivationRow({
                activation: 'verified_pending_completion',
                pendingFact: 'liveness_check_failed',
            })
        ).toEqual({
            status: 'pendingWallet',
            pendingKey: 'newKeyTransfer.pending.livenessCheckFailed',
        });
    });

    it('keeps a refusal a refusal, with its issue', () => {
        expect(
            describeNewKeyTransferActivationRow({
                activation: 'not_verified',
                issue: 'activation_not_found',
            })
        ).toEqual({ status: 'failed', issue: 'activation_not_found' });
    });
});

describe('stabilization SD7 start replay plan', () => {
    const fingerprint = newKeyStartInputFingerprint({
        accounts: [
            { accountId: 'alice.testnet', sourcePublicKey: 'ed25519:AAA' },
            { accountId: 'bob.testnet', sourcePublicKey: 'ed25519:BBB' },
        ],
        networkId: 'testnet',
        targetPlatform: 'web',
    });

    it('replays a stashed id for the identical request, and only then', () => {
        expect(
            resolveNewKeyStartReplayPlan({
                stored: { clientTransferId: 'stashed-id', inputFingerprint: fingerprint },
                inputFingerprint: fingerprint,
            })
        ).toEqual({ clientTransferId: 'stashed-id', isReplay: true });
        expect(
            resolveNewKeyStartReplayPlan({ stored: null, inputFingerprint: fingerprint })
        ).toEqual({ clientTransferId: undefined, isReplay: false });
        expect(
            resolveNewKeyStartReplayPlan({
                stored: { clientTransferId: 'stashed-id', inputFingerprint: 'different' },
                inputFingerprint: fingerprint,
            })
        ).toEqual({ clientTransferId: undefined, isReplay: false });
    });

    it('fingerprints the same selection identically regardless of account order', () => {
        const reordered = newKeyStartInputFingerprint({
            accounts: [
                { accountId: 'bob.testnet', sourcePublicKey: 'ed25519:BBB' },
                { accountId: 'alice.testnet', sourcePublicKey: 'ed25519:AAA' },
            ],
            networkId: 'testnet',
            targetPlatform: 'web',
        });
        expect(reordered).toBe(fingerprint);
        const differentTarget = newKeyStartInputFingerprint({
            accounts: [{ accountId: 'alice.testnet', sourcePublicKey: 'ed25519:AAA' }],
            networkId: 'testnet',
            targetPlatform: 'mobile',
        });
        expect(differentTarget).not.toBe(fingerprint);
    });
});

describe('stabilization SD11 typed-error coverage', () => {
    it('maps every code on the SDK typed error surface, including the SD4 additions', () => {
        // Mirror of the SDK's NEW_KEY_TRANSFER_ERROR_CODES (meteor-sdk-v1
        // new_key_transfer_errors.ts). Extend BOTH when a code is added there.
        const sdkCodes = [
            'new_key_transfer_unavailable',
            'new_key_transfer_client_id_conflict',
            'new_key_transfer_orphaned_add_key_recovery',
            'new_key_transfer_wallet_binding_missing',
            'new_key_transfer_wallet_connection_missing',
            'new_key_transfer_session_not_found',
            'new_key_transfer_start_result_journal_missing',
            'new_key_transfer_start_result_conflict',
            'new_key_transfer_start_result_referenced',
            'new_key_transfer_start_result_discard_failed',
            'new_key_transfer_no_accounts_ready',
            'new_key_transfer_add_key_account_mismatch',
            'new_key_transfer_add_key_chain_required',
            'new_key_transfer_journal_corrupt',
            'new_key_transfer_journal_retention_required',
            'new_key_transfer_verify_before_add_key_intent',
            'new_key_transfer_verify_hash_mismatch',
            'new_key_transfer_verify_session_update_failed',
            'new_key_transfer_recovery_required',
            'new_key_transfer_revoke_chain_required',
            'new_key_transfer_revoke_destination_key_present',
            'new_key_transfer_revoked_accounts_required',
            'new_key_transfer_revoke_account_mismatch',
            'new_key_transfer_session_not_terminal',
        ];
        for (const code of sdkCodes) {
            const described = describeNewKeyTransferError(new Error(code));
            expect(`${code}:${Boolean(described.i18nKey)}`).toBe(`${code}:true`);
        }
    });
});

describe('AddKeyJournalError localization', () => {
    const journalError = (code) => {
        const error = new Error('host-neutral SDK copy');
        error.name = 'AddKeyJournalError';
        error.code = code;
        return error;
    };

    it('maps every journal code to grouped user copy, keeping the raw code for support', () => {
        // Mirror of the SDK's TAddKeyJournalErrorCode union. Extend BOTH on additions there.
        const codes = [
            'journal_unreadable',
            'journal_unsupported_shape',
            'journal_duplicate_operations',
            'journal_operation_conflict',
            'journal_record_mismatch',
            'journal_persist_failed',
            'access_keys_malformed',
            'destination_key_unproven',
            'source_key_missing',
            'source_key_not_full_access',
            'signed_transaction_invalid',
            'broadcast_ambiguous',
            'finalized_proof_invalid',
            'start_result_conflict',
            'start_result_corrupt',
            'start_result_persist_failed',
            'start_result_clear_failed',
            'pending_verify_conflict',
            'pending_verify_corrupt',
            'pending_verify_persist_failed',
        ];
        for (const code of codes) {
            const described = describeNewKeyTransferError(journalError(code));
            expect(`${code}:${Boolean(described.i18nKey)}`).toBe(`${code}:true`);
            expect(described.code).toBe(code);
        }
    });

    it('passes an unknown journal code through with its own message', () => {
        const described = describeNewKeyTransferError(journalError('brand_new_code'));
        expect(described).toEqual({
            fallback: 'host-neutral SDK copy',
            code: 'brand_new_code',
            isFenced: false,
        });
    });
});

describe('contract version skew mapping', () => {
    it('maps the typed bridge-session ids to the refresh copy', () => {
        const typed = new Error(
            "The action's declared recovery contract does not match the server-resolved contract — update the client or backend contract version"
        );
        typed.ids = ['recovery_contract_mismatch'];
        expect(describeNewKeyTransferError(typed)).toEqual({
            i18nKey: 'newKeyTransfer.error.versionSkew',
            code: 'recovery_contract_mismatch',
            isFenced: false,
        });

        const requestHash = new Error('irrelevant');
        requestHash.ids = ['request_hash_mismatch'];
        expect(describeNewKeyTransferError(requestHash).i18nKey).toBe(
            'newKeyTransfer.error.versionSkew'
        );
    });

    it('still catches the skew when only the protocol sentence survives a boundary', () => {
        const flattened = new Error(
            "The action's declared recovery contract does not match the server-resolved contract — update the client or backend contract version"
        );
        expect(describeNewKeyTransferError(flattened)).toEqual({
            i18nKey: 'newKeyTransfer.error.versionSkew',
            code: 'recovery_contract_mismatch',
            isFenced: false,
        });
    });
});

describe('resolveNewKeyStartOverPlan', () => {
    /** Give the fixture the start-request half of the join: one source key per accepted row. */
    const withSourceKeys = (session) => ({
        ...session,
        startRequest: {
            ...session.startRequest,
            accounts: session.startOutput.accounts
                .filter((row) => row.ok)
                .map(({ blockchainId, networkId, accountId }) => ({
                    blockchainId,
                    networkId,
                    accountId,
                    sourcePublicKey: `ed25519:source-${accountId}`,
                })),
        },
    });

    it('is stash-discard only when there is no session at all', () => {
        expect(resolveNewKeyStartOverPlan({ session: null })).toEqual({
            kind: 'discard_stash_only',
        });
    });

    it('clears directly while no AddKey intent is journaled', () => {
        expect(resolveNewKeyStartOverPlan({ session: makeSession() })).toEqual({
            kind: 'clear',
            clientTransferId: 'transfer-1',
        });
    });

    it('refuses once any account is secured — those keys run the imported accounts', () => {
        const session = {
            ...withSourceKeys(
                makeSession({ addKeyIntentAccounts: [identity('alice.testnet')] })
            ),
            securedAccounts: [identity('alice.testnet')],
        };
        expect(resolveNewKeyStartOverPlan({ session })).toEqual({
            kind: 'refuse_secured',
        });
    });

    it('plans a revoke of every intent row with its exact keys, then the clear', () => {
        const session = withSourceKeys(
            makeSession({
                accounts: [readyRow('alice.testnet'), readyRow('bob.testnet')],
                addKeyIntentAccounts: [
                    identity('alice.testnet'),
                    identity('bob.testnet'),
                ],
            })
        );
        const plan = resolveNewKeyStartOverPlan({ session });
        expect(plan.kind).toBe('revoke_then_clear');
        expect(plan.clientTransferId).toBe('transfer-1');
        expect(plan.transferSessionId).toBe('transfer-1-session');
        expect(plan.accounts).toEqual([
            {
                blockchainId: 'near',
                networkId: 'testnet',
                accountId: 'alice.testnet',
                sourcePublicKey: 'ed25519:source-alice.testnet',
                destinationPublicKey: readyRow('alice.testnet').destinationPublicKey,
            },
            {
                blockchainId: 'near',
                networkId: 'testnet',
                accountId: 'bob.testnet',
                sourcePublicKey: 'ed25519:source-bob.testnet',
                destinationPublicKey: readyRow('bob.testnet').destinationPublicKey,
            },
        ]);
    });

    it('fails closed when an intent row has no accepted output row to name its key', () => {
        const session = withSourceKeys(
            makeSession({
                accounts: [readyRow('alice.testnet')],
                addKeyIntentAccounts: [identity('ghost.testnet')],
            })
        );
        expect(resolveNewKeyStartOverPlan({ session })).toEqual({
            kind: 'refuse_unresolvable',
        });
    });

    it('fails closed when the start request no longer names the source key', () => {
        // The fixture's startRequest has no accounts — the join has nothing to sign with.
        const session = makeSession({
            addKeyIntentAccounts: [identity('alice.testnet')],
        });
        expect(resolveNewKeyStartOverPlan({ session })).toEqual({
            kind: 'refuse_unresolvable',
        });
    });
});

describe('start-over refusal copy', () => {
    it('maps both local refusal codes to their translations', () => {
        expect(
            describeNewKeyTransferError(
                new Error('new_key_transfer_start_over_secured_rows')
            )
        ).toEqual({
            i18nKey: 'newKeyTransfer.error.startOverSecuredRows',
            code: 'new_key_transfer_start_over_secured_rows',
            isFenced: false,
        });
        expect(
            describeNewKeyTransferError(
                new Error('new_key_transfer_start_over_unresolvable')
            )
        ).toEqual({
            i18nKey: 'newKeyTransfer.error.startOverUnresolvable',
            code: 'new_key_transfer_start_over_unresolvable',
            isFenced: false,
        });
    });
});
