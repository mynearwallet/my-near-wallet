import { createAsyncThunk, createSlice, createSelector } from '@reduxjs/toolkit';
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
    tokens: {},
    pools: {
        loading: false,
        all: {},
    },
};

const sortTokensWithBalanceInDecreasingOrder = (tokens) => {
    return tokens.sort((t1, t2) => {
        const balance1 = formatTokenAmount(t1.balance, t1.onChainFTMetadata.decimals);
        const balance2 = formatTokenAmount(t2.balance, t2.onChainFTMetadata.decimals);

        return balance2 - balance1;
    });
};

const fetchTokensData = createAsyncThunk(
    `${SLICE_NAME}/fetchTokensData`,
    async (accountId, { getState, dispatch }) => {
        const { actions: { addTokens } } = swapSlice;
        const { tokenFiatValues, swap: { tokenNames } } = getState();
        const tokens = [];
        const tokensWithBalance = [];

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
                        tokensWithBalance.push(config);
                    } else {
                        tokens.push(config);
                    }
                })
            );
        } catch (error) {
            console.error('Error loading token data', error);
        }

        dispatch(
            addTokens({
                tokens: [
                    ...sortTokensWithBalanceInDecreasingOrder(tokensWithBalance),
                    ...tokens,
                ],
            })
        );
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
                dispatch(fetchTokensData(accountId));
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
        addTokens(state, { payload }) {
            const { tokens } = payload;

            set(state, ['tokens'], tokens);
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
    fetchTokensData,
    ...swapSlice.actions
};

export const reducer = swapSlice.reducer;

const selectTokenConfigs = (state) => Object.values(state[SLICE_NAME].tokens);
const selectPools = (state) => state[SLICE_NAME].pools;

export const selectTokens = createSelector(selectTokenConfigs, (tokens) => tokens);
export const selectAllPools = createSelector(selectPools, ({ all }) => all);
export const selectPoolsLoading = createSelector(
    selectPools,
    ({ loading }) => loading
);
