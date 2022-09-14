import { createAsyncThunk, createSlice, createSelector } from '@reduxjs/toolkit';
import set from 'lodash.set';
import { batch } from 'react-redux';

import fungibleTokenExchange from '../../../services/tokenExchange';
import { wallet } from '../../../utils/wallet';
import { showCustomAlert } from '../../actions/status';
import handleAsyncThunkStatus from '../../reducerStatus/handleAsyncThunkStatus';
import { getCachedContractMetadataOrFetch } from '../tokensMetadata';

const SLICE_NAME = 'swap';

const initialState = {
    tokensList: [],
    tokens: {},
    pools: {
        loading: false,
        all: {},
    },
};

const fetchTokensData = createAsyncThunk(
    `${SLICE_NAME}/fetchTokensData`,
    async (_, { getState, dispatch }) => {
        const { actions: { addTokens } } = swapSlice;
        const { swap: { tokensList } } = getState();
        const tokens = {};

        try {
            await Promise.allSettled(
                tokensList.map(async (contractName) => {
                    const metadata = await getCachedContractMetadataOrFetch(
                        contractName,
                        getState()
                    );

                    tokens[contractName] = {
                        contractName,
                        onChainFTMetadata: metadata,
                    };
                })
            );
        } catch (error) {
            console.error('Error loading token data', error);
        }

        dispatch(addTokens({ tokens }));
    }
);

const fetchData = createAsyncThunk(
    `${SLICE_NAME}/fetchData`,
    async ({ accountId }, { dispatch }) => {
        const {
            actions: { setPoolsLoading, addPools, addTokensList },
        } = swapSlice;

        dispatch(setPoolsLoading(true));

        try {
            const account = await wallet.getAccount(accountId);
            const { pools, tokens } = await fungibleTokenExchange.getData({
                account,
            });

            batch(() => {
                dispatch(addTokensList({ tokensList: tokens }));
                dispatch(addPools({ pools }));
                dispatch(setPoolsLoading(false));
                dispatch(fetchTokensData());
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
        addTokensList(state, { payload }) {
            const { tokensList } = payload;

            set(state, ['tokensList'], tokensList);
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
