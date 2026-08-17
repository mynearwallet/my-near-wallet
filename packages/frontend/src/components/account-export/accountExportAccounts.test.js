const makeKeyPair = (publicKey) => ({
    getPublicKey: () => ({ toString: () => publicKey }),
});

const mockWallet = {
    keyStore: { getAccounts: jest.fn() },
    getLocalKeyPair: jest.fn(),
    hasTwoFactorEnabled: jest.fn(),
    isFullAccessKey: jest.fn(),
};
const mockGetKeyMeta = jest.fn();

jest.mock('../../config', () => ({ NETWORK_ID: 'testnet' }));
jest.mock('../../utils/wallet', () => ({
    wallet: mockWallet,
    getKeyMeta: mockGetKeyMeta,
}));

import { loadExportableAccounts, loadNewKeyTransferAccounts } from './accountExportAccounts';

describe('new-key account-transfer eligibility', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockWallet.hasTwoFactorEnabled.mockResolvedValue(false);
        mockWallet.isFullAccessKey.mockResolvedValue(true);
        mockGetKeyMeta.mockResolvedValue({ type: 'software' });
    });

    it('accepts only local software Ed25519 full-access keys', async () => {
        const ids = [
            'ready.testnet',
            'missing.testnet',
            'ledger.testnet',
            'secp.testnet',
            'two-factor.testnet',
            'function-call.testnet',
        ];
        mockWallet.keyStore.getAccounts.mockResolvedValue(ids);
        mockWallet.getLocalKeyPair.mockImplementation(async (accountId) => {
            if (accountId === 'missing.testnet') return null;
            if (accountId === 'secp.testnet') return makeKeyPair('secp256k1:unsupported');
            return makeKeyPair(`ed25519:${accountId}`);
        });
        mockGetKeyMeta.mockImplementation(async (publicKey) => ({
            type: publicKey.includes('ledger') ? 'ledger' : 'software',
        }));
        mockWallet.hasTwoFactorEnabled.mockImplementation(
            async (accountId) => accountId === 'two-factor.testnet'
        );
        mockWallet.isFullAccessKey.mockImplementation(
            async (accountId) => accountId !== 'function-call.testnet'
        );

        const rows = await loadExportableAccounts();
        expect(Object.fromEntries(rows.map((row) => [row.accountId, row.availability]))).toEqual({
            'ready.testnet': 'available',
            'missing.testnet': 'no_local_key',
            'ledger.testnet': 'ledger_unsupported',
            'secp.testnet': 'algorithm_unsupported',
            'two-factor.testnet': 'two_factor_unsupported',
            'function-call.testnet': 'not_full_access',
        });
        expect(rows.find((row) => row.accountId === 'ready.testnet').sourcePublicKey).toBe(
            'ed25519:ready.testnet'
        );
    });

    it('refuses staging when the exact selected source key changes after eligibility', async () => {
        mockWallet.keyStore.getAccounts.mockResolvedValue(['alice.testnet']);
        mockWallet.getLocalKeyPair
            .mockResolvedValueOnce(makeKeyPair('ed25519:original'))
            .mockResolvedValueOnce(makeKeyPair('ed25519:replacement'));

        await expect(loadNewKeyTransferAccounts(['alice.testnet'])).rejects.toThrow(
            'The selected source key for alice.testnet changed.'
        );
    });
});
