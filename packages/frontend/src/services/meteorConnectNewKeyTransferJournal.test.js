const MOCK_SOURCE_KEY = 'ed25519:4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi';
const MOCK_DESTINATION_KEY = 'ed25519:CktRuQ2mttgRGkXJtyksdKHjUdc2C4TgDzyB98oEzy8';
const MOCK_TRANSACTION_HASH = 'GgBaCs3NCBuZN12kCJgAW63ydqohFkHEdfdEXBPzLHq';

jest.mock('@meteorwallet/sdk', () => ({
    EMeteorAppId: {
        meteor_wallet_web_dev: 'meteor_wallet_web_dev',
        meteor_wallet_mobile_dev: 'meteor_wallet_mobile_dev',
    },
    MeteorConnect: jest.fn(() => ({})),
    webpage_local_storage: {},
}));
jest.mock('../config', () => ({
    CURRENT_NEAR_NETWORK: 'testnet',
    IS_DEVELOPMENT: false,
    NETWORK_ID: 'testnet',
}));
jest.mock('../utils/wallet', () => ({ wallet: {} }));

import { assertNewKeyTransferJournal } from './meteorConnect';

const makeCommittedSession = () => ({
    formatVersion: 1,
    clientTransferId: 'A'.repeat(22),
    targetPlatform: 'web',
    phase: 'start_result_committed',
    requestedAccounts: [
        {
            blockchainId: 'near',
            networkId: 'testnet',
            accountId: 'alice.testnet',
            sourcePublicKey: MOCK_SOURCE_KEY,
        },
    ],
    accounts: [
        {
            blockchainId: 'near',
            networkId: 'testnet',
            accountId: 'alice.testnet',
            sourcePublicKey: MOCK_SOURCE_KEY,
            destinationPublicKey: MOCK_DESTINATION_KEY,
            destinationSignerType: 'seed_phrase',
            updatedAt: 1,
        },
    ],
    rejectedAccounts: [],
    createdAt: 1,
    updatedAt: 1,
    transferSessionId: 'B'.repeat(22),
    walletConnection: {
        executionTarget: 'v2_bridge_mobile',
        schemaVersion: 1,
        bridgeEnvironmentId: 'environment',
        meteorAppId: 'meteor_wallet_web_dev',
        partnerClientId: 'partner-client',
        walletVerifyPublicKey: `ed25519::raw_base64::${Buffer.alloc(32, 5).toString(
            'base64'
        )}`,
    },
});

const assertCorrupt = (mutate) => {
    const session = makeCommittedSession();
    mutate(session);
    expect(() =>
        assertNewKeyTransferJournal({ formatVersion: 1, sessions: [session] })
    ).toThrow('corrupt');
};

describe('new-key transfer journal validation', () => {
    it('accepts committed success and all-failed result partitions', () => {
        const success = makeCommittedSession();
        expect(
            assertNewKeyTransferJournal({ formatVersion: 1, sessions: [success] })
        ).toEqual({ formatVersion: 1, sessions: [success] });

        const failed = makeCommittedSession();
        failed.accounts = [];
        failed.rejectedAccounts = [
            {
                blockchainId: 'near',
                networkId: 'testnet',
                accountId: 'alice.testnet',
                ok: false,
                issue: 'source_key_not_found',
            },
        ];
        expect(() =>
            assertNewKeyTransferJournal({ formatVersion: 1, sessions: [failed] })
        ).not.toThrow();
    });

    it('rejects missing bindings, unknown fields, and wrong result partitions', () => {
        assertCorrupt((session) => {
            delete session.transferSessionId;
        });
        assertCorrupt((session) => {
            session.walletConnection.unexpected = true;
        });
        assertCorrupt((session) => {
            session.accounts[0].accountId = 'mallory.testnet';
        });
    });

    it('requires a canonical finalized AddKey hash and committed SDK intent for later states', () => {
        const finalized = makeCommittedSession();
        Object.assign(finalized.accounts[0], {
            state: 'add_key_finalized',
            sdkIntentCommitted: true,
            addKeyTransactionHash: MOCK_TRANSACTION_HASH,
        });
        expect(() =>
            assertNewKeyTransferJournal({ formatVersion: 1, sessions: [finalized] })
        ).not.toThrow();

        assertCorrupt((session) => {
            session.accounts[0].state = 'add_key_finalized';
            session.accounts[0].sdkIntentCommitted = true;
        });
        assertCorrupt((session) => {
            session.accounts[0].state = 'add_key_finalized';
            session.accounts[0].sdkIntentCommitted = true;
            session.accounts[0].addKeyTransactionHash = 'not-a-hash';
        });
        assertCorrupt((session) => {
            session.accounts[0].state = 'add_key_finalized';
            session.accounts[0].addKeyTransactionHash = MOCK_TRANSACTION_HASH;
        });
    });

    it('rejects duplicate durable identifiers and malformed recovery facts', () => {
        const first = makeCommittedSession();
        const duplicate = makeCommittedSession();
        duplicate.transferSessionId = 'C'.repeat(22);
        expect(() =>
            assertNewKeyTransferJournal({
                formatVersion: 1,
                sessions: [first, duplicate],
            })
        ).toThrow('corrupt');

        duplicate.clientTransferId = 'C'.repeat(22);
        duplicate.transferSessionId = first.transferSessionId;
        expect(() =>
            assertNewKeyTransferJournal({
                formatVersion: 1,
                sessions: [first, duplicate],
            })
        ).toThrow('corrupt');

        assertCorrupt((session) => {
            Object.assign(session.accounts[0], {
                state: 'add_key_finalized',
                sdkIntentCommitted: true,
                addKeyTransactionHash: MOCK_TRANSACTION_HASH,
                recovery: 'revoke_destination_key',
            });
        });
        assertCorrupt((session) => {
            session.accounts[0].updatedAt = session.updatedAt + 1;
        });
    });
});
