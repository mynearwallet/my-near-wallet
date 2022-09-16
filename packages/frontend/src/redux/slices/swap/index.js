import { createAsyncThunk, createSlice, createSelector } from '@reduxjs/toolkit';
import merge from 'lodash.merge';
import set from 'lodash.set';
import { batch } from 'react-redux';

import FungibleTokens from '../../../services/FungibleTokens';
import fungibleTokenExchange from '../../../services/tokenExchange';
import { formatTokenAmount } from '../../../utils/amounts';
import { wallet } from '../../../utils/wallet';
import { showCustomAlert } from '../../actions/status';
import handleAsyncThunkStatus from '../../reducerStatus/handleAsyncThunkStatus';
import { getCachedContractMetadataOrFetch } from '../tokensMetadata';

const SLICE_NAME = 'swap';

const initialState = {
    tokenNames: [],
    tokens: {
        loading: false,
        all: {},
    },
    pools: {
        loading: false,
        all: {},
    },
};

const sortTokensWithBalanceInDecreasingOrder = (tokens) => {
    return Object.values(tokens)
        .sort((t1, t2) => {
            const balance1 = formatTokenAmount(
                t1.balance,
                t1.onChainFTMetadata.decimals
            );
            const balance2 = formatTokenAmount(
                t2.balance,
                t2.onChainFTMetadata.decimals
            );

            return balance2 - balance1;
        })
        .reduce((acc, token) => ({ ...acc, [token.contractName]: token }), {});
};

const updateTokensBalance = createAsyncThunk(
    `${SLICE_NAME}/updateTokensBalance`,
    async ({ accountId, tokenIds }, { getState, dispatch }) => {
        const { actions: { addTokens } } = swapSlice;
        const { swap: { tokens: { all } } } = getState();
        const updatedTokens = {};

        try {
            await Promise.allSettled(
                tokenIds.map(async (contractName) => {
                    const balance = await FungibleTokens.getBalanceOf({
                        contractName,
                        accountId,
                    });

                    updatedTokens[contractName] = {
                        ...all[contractName],
                        balance,
                    };
                })
            );
        } catch (error) {
            console.error('Error loading token balance', error);
        }

        dispatch(addTokens({ tokens: updatedTokens }));
    }
);

const updateAllTokensData = createAsyncThunk(
    `${SLICE_NAME}/updateAllTokensData`,
    async (accountId, { getState, dispatch }) => {
        const { actions: { setAllTokensLoading, addAllTokens } } = swapSlice;
        const { tokenFiatValues, swap: { tokenNames } } = getState();
        const tokens = {};
        const tokensWithBalance = {};

        dispatch(setAllTokensLoading(true));

        try {
            await Promise.allSettled(
                tokenNames.map(async (contractName) => {
                    const onChainFTMetadata = await getCachedContractMetadataOrFetch(
                        contractName,
                        getState()
                    );
                    const balance = await FungibleTokens.getBalanceOf({
                        contractName,
                        accountId,
                    });
                    const config = {
                        contractName,
                        balance,
                        onChainFTMetadata,
                        fiatValueMetadata: tokenFiatValues.tokens[contractName] || {},
                    };

                    if (balance > 0) {
                        tokensWithBalance[contractName] = config;
                    } else {
                        tokens[contractName] = config;
                    }
                })
            );
        } catch (error) {
            console.error('Error loading token data', error);
        }

        batch(() => {
            dispatch(
                addAllTokens({
                    tokens: {
                        ...sortTokensWithBalanceInDecreasingOrder(tokensWithBalance),
                        ...tokens,
                    },
                })
            );
            dispatch(setAllTokensLoading(false));
        });
    }
);

const fetchData = createAsyncThunk(
    `${SLICE_NAME}/fetchData`,
    async ({ accountId }, { dispatch }) => {
        const {
            actions: { setPoolsLoading, addPools, addTokenNames },
        } = swapSlice;

        dispatch(setPoolsLoading(true));

        try {
            const account = await wallet.getAccount(accountId);
            const { pools, tokens } = await fungibleTokenExchange.getData({
                account,
            });

            batch(() => {
                dispatch(addTokenNames({ tokenNames: tokens }));
                dispatch(addPools({ pools }));
                dispatch(setPoolsLoading(false));
                dispatch(updateAllTokensData(accountId));
            });
        } catch (error) {
            console.error('Error loading swap data', error);
            dispatch(
                showCustomAlert({
                    success: false,
                    messageCodeHeader: 'error',
                    messageCode: 'swap.errorToFetchData',
                    errorMessage: error.message,
                })
            );
        }
    }
);

const swapSlice = createSlice({
    name: SLICE_NAME,
    initialState,
    reducers: {
        setPoolsLoading(state, { payload }) {
            set(state, ['pools', 'loading'], payload);
        },
        addPools(state, { payload }) {
            const { pools } = payload;

            set(state, ['pools', 'all'], pools);
        },
        addTokenNames(state, { payload }) {
            const { tokenNames } = payload;

            set(state, ['tokenNames'], tokenNames);
        },
        setAllTokensLoading(state, { payload }) {
            set(state, ['tokens', 'loading'], payload);
        },
        addAllTokens(state, { payload }) {
            const { tokens } = payload;

            set(state, ['tokens', 'all'], tokens);
        },
        addTokens(state, { payload }) {
            const { tokens } = payload;

            merge(state, { tokens: { all: tokens } });
        },
    },
    extraReducers: (builder) => {
        handleAsyncThunkStatus({
            asyncThunk: fetchData,
            buildStatusPath: () => [],
            builder,
        });
    },
});

export default swapSlice;

export const actions = {
    fetchData,
    updateTokensBalance,
    ...swapSlice.actions
};

export const reducer = swapSlice.reducer;

const selectAllTokenConfigs = (state) => state[SLICE_NAME].tokens.all;
const selectAllTokenLoading = (state) => state[SLICE_NAME].tokens.loading;
const selectPools = (state) => state[SLICE_NAME].pools;

export const selectAllTokens = createSelector(selectAllTokenConfigs, (tokens) => tokens);
export const selectAllTokensLoading = createSelector(selectAllTokenLoading, (loading) => loading);

export const selectAllPools = createSelector(selectPools, ({ all }) => all);
export const selectPoolsLoading = createSelector(
    selectPools,
    ({ loading }) => loading
);
