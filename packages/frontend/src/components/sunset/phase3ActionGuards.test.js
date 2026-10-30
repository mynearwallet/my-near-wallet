import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockGetAccount = jest.fn();
const mockExecutor = jest.fn();
const mockTrackBlocked = jest.fn();

// A Phase 3 build: the action layer must refuse everything limited mode retires, even when a UI
// entry point was missed.
jest.mock('../../config', () => ({
    __esModule: true,
    default: { SUNSET_PHASE: 3, NEAR_WALLET_ENV: 'testnet', NEAR_ID: 'NEAR' },
}));
jest.mock('./sunsetAnalytics', () => ({
    trackSunsetFeatureBlocked: (...args) => mockTrackBlocked(...args),
}));
jest.mock('../../utils/wallet', () => ({
    wallet: {
        getAccount: (...args) => mockGetAccount(...args),
        getAccountBasic: () => ({}),
    },
}));
jest.mock('../../redux/slices/sign/transactionExecutor', () => ({
    dispatchTransactionExecutor: (...args) => mockExecutor(...args),
}));
jest.mock('../../services/metapool/constant', () => ({
    METAPOOL_CONTRACT_ID: 'meta-pool.testnet',
    METAPOOL_STAKING_GAS: '1',
}));
jest.mock('../../services/coreIndexer/CoreIndexerAdapter', () => ({}));
jest.mock('../../utils/query/queryClient', () => ({}));
jest.mock('../../utils/gasPrice', () => ({}));

// eslint-disable-next-line import/first
import { isSunsetCapabilityError, SUNSET_PHASE } from '../../config/sunset';
// eslint-disable-next-line import/first
import {
    delayedUnstake,
    liquidStaking,
    liquidUnStake,
    liquidWithdrawAll,
} from '../../redux/actions/liquidStaking';
// eslint-disable-next-line import/first
import { fungibleTokensService } from '../../services/FungibleTokens';
// eslint-disable-next-line import/first
import NonFungibleTokens from '../../services/NonFungibleTokens';
// eslint-disable-next-line import/first
import { guardSunsetCapability } from './sunsetGuard';

const expectRetired = async (action, capability) => {
    let thrown;
    try {
        await action();
    } catch (error) {
        thrown = error;
    }
    expect(isSunsetCapabilityError(thrown)).toBe(true);
    expect(thrown.capability).toBe(capability);
    expect(mockTrackBlocked).toHaveBeenCalledWith({ capability, entry: 'action' });
};

describe('Phase 3 action guards', () => {
    beforeEach(() => {
        mockGetAccount.mockReset();
        mockExecutor.mockReset();
        mockTrackBlocked.mockReset();
    });

    it('runs as a Phase 3 build', () => {
        expect(SUNSET_PHASE).toBe(3);
    });

    it('refuses NEAR and token sends before touching the account', async () => {
        await expectRetired(
            () =>
                fungibleTokensService.transfer({
                    accountId: 'alice.testnet',
                    contractName: 'NEAR',
                    amount: '1',
                    receiverId: 'bob.testnet',
                }),
            'send'
        );
        expect(mockGetAccount).not.toHaveBeenCalled();
    });

    it('refuses NFT transfers before touching the account', async () => {
        await expectRetired(
            () =>
                NonFungibleTokens.transfer({
                    accountId: 'alice.testnet',
                    contractId: 'nft.testnet',
                    tokenId: '1',
                    receiverId: 'bob.testnet',
                }),
            'nftTransfer'
        );
        expect(mockGetAccount).not.toHaveBeenCalled();
    });

    it.each([
        [
            'liquid unstake',
            () => liquidUnStake({ contractId: 'meta', amountInYocto: '1' }),
        ],
        [
            'delayed unstake',
            () => delayedUnstake({ contractId: 'meta', amountInYocto: '1' }),
        ],
        ['withdraw all', () => liquidWithdrawAll({ contractId: 'meta' })],
    ])('refuses liquid staking %s', async (_, action) => {
        await expectRetired(action, 'stakeManage');
        expect(mockExecutor).not.toHaveBeenCalled();
    });

    it('still refuses new liquid stakes', async () => {
        await expectRetired(
            () =>
                liquidStaking({
                    contractId: 'meta',
                    amountInYocto: '1',
                    accountId: 'alice.testnet',
                }),
            'stakeDeposit'
        );
        expect(mockExecutor).not.toHaveBeenCalled();
    });

    it('keeps the lockup transfer into the user’s own account', () => {
        expect(() => guardSunsetCapability('lockupTransfer')).not.toThrow();
        expect(mockTrackBlocked).not.toHaveBeenCalled();
    });
});
