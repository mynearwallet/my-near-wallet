const mockWallet = {
    getLocalKeyPair: jest.fn(),
    connection: { networkId: 'testnet', provider: {} },
};

jest.mock('../config', () => ({ NETWORK_ID: 'testnet' }));
jest.mock('../utils/wallet', () => ({ wallet: mockWallet }));

// Deliberately below the mocks: their factories close over the consts above, which babel-jest
// does not hoist — importing first would load the real wallet module.
// eslint-disable-next-line import/first
import { removeDestinationKeyWithSourceSigner } from './meteorConnectAddKeyChain';

// Two real, distinct Ed25519 public keys (32-byte base58 payloads).
const SOURCE_KEY = 'ed25519:uTb6CpF96iimqtPVtNMeStngLoPHjiuWTurNEdzZNJf';
const OTHER_KEY = 'ed25519:3ykcqh6WCUd7taK3EakbdmC9Boc84EVpNdiC2Egof5dk';

describe('removeDestinationKeyWithSourceSigner key-safety guard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('refuses to remove a destination key equal to the source key', async () => {
        await expect(
            removeDestinationKeyWithSourceSigner({
                accountId: 'alice.testnet',
                sourcePublicKey: SOURCE_KEY,
                destinationPublicKey: SOURCE_KEY,
            })
        ).rejects.toThrow('new_key_transfer_refused_source_key_removal');
        // Refused before the signer is even resolved — nothing touches the keystore.
        expect(mockWallet.getLocalKeyPair).not.toHaveBeenCalled();
    });

    it('normalizes key formats, so an unprefixed copy of the source key is still refused', async () => {
        await expect(
            removeDestinationKeyWithSourceSigner({
                accountId: 'alice.testnet',
                sourcePublicKey: SOURCE_KEY,
                destinationPublicKey: SOURCE_KEY.replace('ed25519:', ''),
            })
        ).rejects.toThrow('new_key_transfer_refused_source_key_removal');
        expect(mockWallet.getLocalKeyPair).not.toHaveBeenCalled();
    });

    it('lets a genuinely different destination key through to the exact-signer check', async () => {
        // Past the guard, the next fence is key isolation: the LOCAL key must equal the source
        // key. A missing local key fails closed there rather than signing with other authority.
        mockWallet.getLocalKeyPair.mockResolvedValue(null);
        await expect(
            removeDestinationKeyWithSourceSigner({
                accountId: 'alice.testnet',
                sourcePublicKey: SOURCE_KEY,
                destinationPublicKey: OTHER_KEY,
            })
        ).rejects.toThrow(
            'The exact source signing key for alice.testnet is no longer available in this wallet.'
        );
        expect(mockWallet.getLocalKeyPair).toHaveBeenCalledWith('alice.testnet');
    });
});
