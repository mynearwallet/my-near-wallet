import {
    describeNewKeyTransferError,
    findResumableNewKeyTransfer,
    isNewKeyTransferFinished,
    newKeyTransferAccountIdentity,
    newKeyTransferEligibilityKey,
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
        ? { formatVersion: 1, clientTransferId, transferSessionId: `${clientTransferId}-session`, accounts }
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
                makeSession({ accounts: [refusedRow('alice.testnet', 'account_not_found')] })
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
                makeSession({ accounts: [refusedRow('alice.testnet', 'rpc_lookup_failed')] }),
            ])
        ).toBeUndefined();
    });
});

describe('describeNewKeyTransferError', () => {
    it('maps a known SDK code to a translation key', () => {
        expect(
            describeNewKeyTransferError(
                new Error('new_key_transfer_start_result_journal_missing')
            )
        ).toEqual({ i18nKey: 'newKeyTransfer.error.startResultMissing' });
    });

    it('passes an unmapped message through so the SDK can speak for itself', () => {
        // The AddKey journal writes its own messages for a human to act on; replacing them with
        // a generic string would throw away the only recovery instruction the user gets.
        const message =
            'alice.testnet exact signed AddKey transaction is saved, but broadcast is ambiguous.';
        expect(describeNewKeyTransferError(new Error(message))).toEqual({
            fallback: message,
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
