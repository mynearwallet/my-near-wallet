const mockTrack = jest.fn();

jest.mock('../../mixpanel', () => ({
    Mixpanel: { track: mockTrack },
}));

// eslint-disable-next-line import/first
import {
    safeMigrationErrorCode,
    trackManualCredentialsLoaded,
    trackMigrationAccountsScanned,
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
    });
});
