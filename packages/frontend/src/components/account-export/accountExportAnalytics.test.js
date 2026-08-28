const mockTrack = jest.fn();

jest.mock('../../mixpanel', () => ({
    Mixpanel: { track: mockTrack },
}));
jest.mock('../../config', () => ({ CURRENT_NEAR_NETWORK: 'testnet' }));

// eslint-disable-next-line import/first
import {
    safeMigrationErrorCode,
    trackManualCredentialsLoaded,
    trackMigrationAccountsScanned,
    trackMigrationVerificationFinished,
    trackMigrationVerificationRequested,
    trackNewKeyMigrationCompleted,
    trackNewKeyPrepareSucceeded,
} from './accountExportAnalytics';

describe('account export analytics', () => {
    beforeEach(() => {
        mockTrack.mockClear();
    });

    it('reports account eligibility with public account identity', () => {
        trackMigrationAccountsScanned([
            {
                accountId: 'alice.near',
                availability: 'available',
                sourcePublicKey: 'ed25519:alice-public',
            },
            { accountId: 'bob.near', availability: 'ledger_unsupported' },
        ]);

        expect(mockTrack).toHaveBeenCalledWith(
            'wallet_migration_accounts_scanned',
            expect.objectContaining({
                total_count: 2,
                eligible_count: 1,
                unavailable_count: 1,
                unavailable_ledger_unsupported_count: 1,
                accounts: [
                    {
                        account_id: 'alice.near',
                        source_public_key: 'ed25519:alice-public',
                    },
                    { account_id: 'bob.near' },
                ],
            })
        );
    });

    it('counts an unfunded implicit account as a known eligibility reason', () => {
        trackMigrationAccountsScanned([
            { accountId: 'a'.repeat(64), availability: 'not_funded' },
        ]);

        expect(mockTrack).toHaveBeenCalledWith(
            'wallet_migration_accounts_scanned',
            expect.objectContaining({
                unavailable_not_funded_count: 1,
                unavailable_unknown_count: 0,
            })
        );
        expect(
            safeMigrationErrorCode(
                Object.assign(new Error('not funded'), {
                    availability: 'not_funded',
                })
            )
        ).toBe('eligibility_not_funded');
    });

    it('reports source and destination public keys with Meteor results', () => {
        trackNewKeyPrepareSucceeded({
            accounts: [
                { accountId: 'alice.near', sourcePublicKey: 'ed25519:alice-source' },
                { accountId: 'bob.near', sourcePublicKey: 'ed25519:bob-source' },
            ],
            accepted: [
                {
                    accountId: 'alice.near',
                    destinationPublicKey: 'ed25519:alice-destination',
                },
            ],
            refused: [{ accountId: 'bob.near', issue: 'rpc_lookup_failed' }],
        });

        expect(mockTrack).toHaveBeenCalledWith(
            'wallet_migration_new_key_prepare_succeeded',
            expect.objectContaining({
                selected_count: 2,
                accepted_count: 1,
                refused_count: 1,
                refused_rpc_lookup_failed_count: 1,
                accounts: [
                    {
                        account_id: 'alice.near',
                        source_public_key: 'ed25519:alice-source',
                        destination_public_key: 'ed25519:alice-destination',
                    },
                    {
                        account_id: 'bob.near',
                        source_public_key: 'ed25519:bob-source',
                    },
                ],
            })
        );
    });

    it('strips private keys even when credential objects contain them', () => {
        trackManualCredentialsLoaded([
            {
                accountId: 'alice.near',
                publicKey: 'ed25519:alice-public',
                privateKey: 'ed25519:alice-private',
            },
        ]);

        expect(mockTrack).toHaveBeenCalledWith(
            'wallet_migration_manual_credentials_loaded',
            expect.objectContaining({
                accounts: [
                    {
                        account_id: 'alice.near',
                        public_key: 'ed25519:alice-public',
                    },
                ],
            })
        );
        expect(JSON.stringify(mockTrack.mock.calls)).not.toContain('alice-private');
    });

    it('never forwards an unknown raw error message', () => {
        expect(safeMigrationErrorCode(new Error('alice.near secret detail'))).toBe(
            'unknown'
        );
        expect(
            safeMigrationErrorCode(
                new Error('new_key_transfer_verification_proof_missing')
            )
        ).toBe('new_key_transfer_verification_proof_missing');
        expect(
            safeMigrationErrorCode(
                new Error('new_key_transfer_insufficient_balance_for_add_keys')
            )
        ).toBe('new_key_transfer_insufficient_balance_for_add_keys');
        expect(
            safeMigrationErrorCode({
                name: 'AddKeyJournalError',
                code: 'broadcast_ambiguous',
                message: 'private implementation detail',
            })
        ).toBe('broadcast_ambiguous');
    });

    it('uses dedicated verification events and separates secured, pending, and failed rows', () => {
        const summary = {
            clientTransferId: 'client-1',
            transferSessionId: 'session-1',
        };
        const accounts = [
            { accountId: 'alice.near' },
            { accountId: 'bob.near' },
            { accountId: 'carol.near' },
        ];
        trackMigrationVerificationRequested({ accounts, summary, attemptNumber: 1 });
        trackMigrationVerificationFinished({
            accounts,
            summary,
            attemptNumber: 1,
            durationMs: 50,
            outputAccounts: [
                { accountId: 'alice.near', activation: 'secured' },
                {
                    accountId: 'bob.near',
                    activation: 'verified_pending_completion',
                    pendingFact: 'import_incomplete',
                },
                {
                    accountId: 'carol.near',
                    activation: 'not_verified',
                    issue: 'rpc_lookup_failed',
                },
            ],
        });

        expect(mockTrack).toHaveBeenNthCalledWith(
            1,
            'wallet_migration_verification_requested',
            expect.objectContaining({
                client_transfer_id: 'client-1',
                transfer_session_id: 'session-1',
                attempt_number: 1,
            })
        );
        expect(mockTrack).toHaveBeenNthCalledWith(
            2,
            'wallet_migration_verification_finished',
            expect.objectContaining({
                secured_count: 1,
                pending_wallet_count: 1,
                failed_count: 1,
                activation_issue_rpc_lookup_failed_count: 1,
                duration_ms: 50,
            })
        );
    });

    it('uses a deterministic insert id for one completed transfer', () => {
        trackNewKeyMigrationCompleted({
            confirmed: [{ accountId: 'alice.near' }],
            unconfirmed: [],
            summary: {
                clientTransferId: 'client-1',
                transferSessionId: 'session-1',
            },
        });

        expect(mockTrack).toHaveBeenCalledWith(
            'wallet_migration_new_key_completed',
            expect.objectContaining({
                $insert_id: 'client-1',
                client_transfer_id: 'client-1',
                transfer_session_id: 'session-1',
            })
        );
    });
});
