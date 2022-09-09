import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import set from 'lodash.set';
import { createSelector } from 'reselect';

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
        const { actions: { addPools, addTokensList } } = swapSlice;
        const account = await wallet.getAccount(accountId);

        try {
            const { pools, tokens } = await fungibleTokenExchange.getData({ account });

            dispatch(addTokensList({ tokensList: tokens }));
            dispatch(addPools({ pools }));
            dispatch(fetchTokensData());
        } catch (error) {
            console.error('Error loading swap data', error);
            dispatch(showCustomAlert({
                success: false,
                messageCodeHeader: 'error',
                messageCode: 'swap.errorToFetchData',
                errorMessage: error.message
            }));
        }
    }
);

const swapSlice = createSlice({
    name: SLICE_NAME,
    initialState,
    reducers: {
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
    extraReducers: ((builder) => {
        handleAsyncThunkStatus({
            asyncThunk: fetchData,
            buildStatusPath: () => [],
            builder,
        });
    })
}
);

export default swapSlice;

export const actions = {
    fetchData,
    fetchTokensData,
    ...swapSlice.actions
};

export const reducer = swapSlice.reducer;

export const selectPoolsSlice = (state) => state[SLICE_NAME].pools;
export const selectTokensSlice = (state) => Object.values(state[SLICE_NAME].tokens);

const selectPools = createSelector(selectPoolsSlice, ({ pools }) => pools || {});

export const selectPoolsLoading = createSelector(
    [selectPools],
    ({ loading }) => loading
);
