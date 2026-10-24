import { configureStore } from '@reduxjs/toolkit';
import FungibleTokens from '../../../services/FungibleTokens';
import { actions, reducer, selectTokensWithBalance } from './index';

jest.mock('../../../config', () => ({ __esModule: true, default: {} }));
jest.mock('../../../services/FungibleTokens', () => ({ __esModule: true, default: {} }));
jest.mock('../../../services/tokenExchange', () => ({ __esModule: true, default: {} }));
jest.mock('../../../utils/wallet', () => ({ wallet: {} }));
jest.mock('../../actions/account', () => ({
    getBalance: jest.fn(() => ({ type: 'account/getBalance' })),
}));
jest.mock('../../actions/status', () => ({ showCustomAlert: jest.fn() }));
jest.mock('../tokensMetadata', () => ({ getCachedContractMetadataOrFetch: jest.fn() }));

test('refreshes spent and received balances without adding an unknown route token', async () => {
    const usdc = {
        contractName: 'usdc.near',
        balance: '100',
        onChainFTMetadata: { decimals: 6, symbol: 'USDC' },
    };
    const output = {
        contractName: 'out.near',
        balance: '0',
        onChainFTMetadata: { decimals: 6, symbol: 'OUT' },
    };
    const store = configureStore({ reducer: { swap: reducer } });
    store.dispatch(actions.addAllTokens({ 'usdc.near': usdc, 'out.near': output }));
    FungibleTokens.getBalanceOf = jest.fn(async ({ contractName }) =>
        contractName === 'usdc.near' ? '0' : '200'
    );

    await store.dispatch(actions.updateTokensBalance({
        accountId: 'alice.near',
        tokenIds: ['usdc.near', 'out.near', 'mid.near'],
    }));

    expect(FungibleTokens.getBalanceOf).toHaveBeenCalledTimes(2);
    expect(store.getState().swap.tokens.all).toEqual({
        'usdc.near': { ...usdc, balance: '0' },
        'out.near': { ...output, balance: '200' },
    });
    expect(selectTokensWithBalance(store.getState())).toEqual({
        'out.near': { ...output, balance: '200' },
    });
});
