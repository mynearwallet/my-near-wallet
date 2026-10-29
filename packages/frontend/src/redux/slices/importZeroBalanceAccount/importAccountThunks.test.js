const mockWallet = {
    accountExists: jest.fn(),
    importZeroBalanceAccount: jest.fn(),
    getAccountBasic: jest.fn(),
};
const mockIsSunsetCapabilityEnabled = jest.fn();
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
jest.mock('../../actions/account', () => ({ getLedgerPublicKey: jest.fn() }));
jest.mock('../../../utils/localStorage', () => ({ setLedgerHdPath: jest.fn() }));
jest.mock('../../../utils/parseSeedPhrase', () => ({
    getImplicitAccountIdFromSeedPhrase: () => 'implicit-account',
    getKeyPairFromSeedPhrase: () => 'key-pair',
}));

// eslint-disable-next-line import/first
import { importZeroBalanceAccountPhrase } from './importAccountThunks';

const run = async () => {
    const dispatch = jest.fn();
    const action = await importZeroBalanceAccountPhrase('some seed phrase')(
        dispatch,
        () => ({}),
        undefined
    );
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
    });

    it('still imports while the capability is available (Phase 1)', async () => {
        mockIsSunsetCapabilityEnabled.mockReturnValue(true);
        const { result } = await run();
        expect(result).toEqual({ imported: true });
        expect(mockWallet.accountExists).not.toHaveBeenCalled();
        expect(mockWallet.importZeroBalanceAccount).toHaveBeenCalledWith(
            'implicit-account',
            'key-pair'
        );
    });

    it('blocks and explains when the chain says the account does not exist', async () => {
        mockIsSunsetCapabilityEnabled.mockReturnValue(false);
        mockWallet.accountExists.mockResolvedValue(false);
        const { result, alerts } = await run();
        expect(result).toEqual({ imported: false, blocked: true });
        expect(alerts).toEqual(['sunset.importBlocked.noAccount']);
        expect(mockTrackBlocked).toHaveBeenCalledWith({ method: 'phrase' });
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
