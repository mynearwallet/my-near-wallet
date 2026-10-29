const mockWallet = {
    accountExists: jest.fn(),
    importZeroBalanceAccount: jest.fn(),
    getAccountBasic: jest.fn(),
};
const mockIsSunsetCapabilityEnabled = jest.fn();
const mockConfirmNoAccountIds = jest.fn();
const mockGetLedgerPublicKey = jest.fn();
const mockKeyPair = { getPublicKey: () => 'ed25519:phrase-key' };
const mockTrackBlocked = jest.fn();

jest.mock('.', () => ({ SLICE_NAME: 'importZeroBalanceAccount' }));
jest.mock('../../../utils/wallet', () => ({
    wallet: mockWallet,
    setKeyMeta: jest.fn(),
}));
jest.mock('../../../config/sunset', () => ({
    isSunsetCapabilityEnabled: (...args) => mockIsSunsetCapabilityEnabled(...args),
}));
jest.mock('../../../components/sunset/sunsetAnalytics', () => ({
    trackSunsetImportNonExistentBlocked: (...args) => mockTrackBlocked(...args),
}));
jest.mock('../../actions/status', () => ({
    clearGlobalAlert: () => ({ type: 'CLEAR_GLOBAL_ALERT' }),
    showCustomAlert: (payload) => ({ type: 'SHOW_CUSTOM_ALERT', payload }),
}));
jest.mock('../../actions/account', () => ({
    getLedgerPublicKey: (...args) => mockGetLedgerPublicKey(...args),
}));
jest.mock('../../../utils/helper-api', () => ({
    confirmNoAccountIdsForPublicKey: (...args) => mockConfirmNoAccountIds(...args),
}));
jest.mock('../../../utils/localStorage', () => ({ setLedgerHdPath: jest.fn() }));
jest.mock('../../../utils/parseSeedPhrase', () => ({
    getImplicitAccountIdFromSeedPhrase: () => 'implicit-account',
    getKeyPairFromSeedPhrase: () => mockKeyPair,
}));

// eslint-disable-next-line import/first
import {
    importZeroBalanceAccountLedger,
    importZeroBalanceAccountPhrase,
} from './importAccountThunks';

const run = async (thunk = importZeroBalanceAccountPhrase('some seed phrase')) => {
    const dispatch = jest.fn((dispatched) =>
        typeof dispatched === 'function' ? dispatched(dispatch) : dispatched
    );
    const action = await thunk(dispatch, () => ({}), undefined);
    const alerts = dispatch.mock.calls
        .map(([dispatched]) => dispatched)
        .filter((dispatched) => dispatched.type === 'SHOW_CUSTOM_ALERT')
        .map((dispatched) => dispatched.payload.messageCode);
    return { result: action.payload, alerts };
};

describe('importing a key with no on-chain account', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockWallet.importZeroBalanceAccount.mockResolvedValue(undefined);
        mockConfirmNoAccountIds.mockResolvedValue(true);
    });

    it('still imports while the capability is available (Phase 1)', async () => {
        mockIsSunsetCapabilityEnabled.mockReturnValue(true);
        const { result } = await run();
        expect(result).toEqual({ imported: true });
        expect(mockWallet.accountExists).not.toHaveBeenCalled();
        expect(mockWallet.importZeroBalanceAccount).toHaveBeenCalledWith(
            'implicit-account',
            mockKeyPair
        );
    });

    it('blocks and explains when the chain says the account does not exist', async () => {
        mockIsSunsetCapabilityEnabled.mockReturnValue(false);
        mockWallet.accountExists.mockResolvedValue(false);
        const { result, alerts } = await run();
        expect(result).toEqual({ imported: false, blocked: true });
        expect(alerts).toEqual(['sunset.importBlocked.noAccount']);
        expect(mockTrackBlocked).toHaveBeenCalledWith({ method: 'phrase' });
        expect(mockConfirmNoAccountIds).toHaveBeenCalledWith('ed25519:phrase-key');
        expect(mockWallet.importZeroBalanceAccount).not.toHaveBeenCalled();
    });

    it('asks for a retry, never "no account", when the indexers cannot confirm it', async () => {
        // Every indexer down looks like an empty lookup, which sends a named account's key here.
        mockIsSunsetCapabilityEnabled.mockReturnValue(false);
        mockWallet.accountExists.mockResolvedValue(false);
        mockConfirmNoAccountIds.mockResolvedValue(false);
        const { result, alerts } = await run();
        expect(result).toEqual({ imported: false, blocked: true });
        expect(alerts).toEqual(['sunset.importBlocked.checkFailed']);
        expect(mockTrackBlocked).not.toHaveBeenCalled();
        expect(mockWallet.importZeroBalanceAccount).not.toHaveBeenCalled();
    });

    it('applies the same confirmation to a Ledger with no account', async () => {
        mockIsSunsetCapabilityEnabled.mockReturnValue(false);
        mockGetLedgerPublicKey.mockReturnValue(() => ({
            data: Buffer.from('ab', 'hex'),
            toString: () => 'ed25519:ledger-key',
        }));
        mockWallet.getAccountBasic.mockReturnValue({
            state: () =>
                Promise.reject(new Error('account ab does not exist while viewing')),
        });
        mockConfirmNoAccountIds.mockResolvedValue(false);
        const { result, alerts } = await run(
            importZeroBalanceAccountLedger('ledger-hd-path')
        );
        expect(result).toEqual({ imported: false, blocked: true });
        expect(alerts).toEqual(['sunset.importBlocked.checkFailed']);
        expect(mockConfirmNoAccountIds).toHaveBeenCalledWith('ed25519:ledger-key');
        expect(mockWallet.importZeroBalanceAccount).not.toHaveBeenCalled();
    });

    it('still imports an account that turns out to exist', async () => {
        mockIsSunsetCapabilityEnabled.mockReturnValue(false);
        mockWallet.accountExists.mockResolvedValue(true);
        const { result, alerts } = await run();
        expect(result).toEqual({ imported: true });
        expect(alerts).toEqual([]);
        expect(mockWallet.importZeroBalanceAccount).toHaveBeenCalled();
    });

    it('asks for a retry, never "no account", when the chain cannot be reached', async () => {
        mockIsSunsetCapabilityEnabled.mockReturnValue(false);
        mockWallet.accountExists.mockRejectedValue(new Error('Failed to fetch'));
        const { result, alerts } = await run();
        expect(result).toEqual({ imported: false, blocked: true });
        expect(alerts).toEqual(['sunset.importBlocked.checkFailed']);
        expect(mockTrackBlocked).not.toHaveBeenCalled();
        expect(mockWallet.importZeroBalanceAccount).not.toHaveBeenCalled();
    });
});
