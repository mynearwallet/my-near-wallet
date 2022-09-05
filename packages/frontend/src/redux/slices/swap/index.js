import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import set from 'lodash.set';
import { createSelector } from 'reselect';

import fungibleTokenExchange from '../../../services/FungibleTokenExchange';
import handleAsyncThunkStatus from '../../reducerStatus/handleAsyncThunkStatus';

const SLICE_NAME = 'swap';
// @note disable swap logs
const ENABLE_DEBUG = true;

const debugLog = (...args) => ENABLE_DEBUG && (function () {
    console.group(`%c ${SLICE_NAME}Slice`, 'color: brown;');
    console.log(`${SLICE_NAME}Slice`, ...args);
    console.groupEnd();
})();

const initialState = {
    pools: {
        loading: false,
        all: {/* 
            [token id]: {
                [pool id]: { pool info }
            }
        */},
    },
};

const fetchPools = createAsyncThunk(
    `${SLICE_NAME}/fetchPools`,
    async ({ accountId }, { dispatch }) => {
        debugLog('THUNK/fetchPools');
        const { actions: { addPools } } = swapSlice;

        try {
            const pools = await fungibleTokenExchange.getPools({ accountId });

            dispatch(addPools({ pools }));
        } catch (error) {
            console.error(error);
            // show some notification + set error state  
        }
    }
);

const swapSlice = createSlice({
    name: SLICE_NAME,
    initialState,
    reducers: {
        addPools(state, { payload }) {
            debugLog('REDUCER/addPools');
            const { pools } = payload;

            set(state, ['pools', 'all'], pools);
        },
    },
    extraReducers: ((builder) => {
        handleAsyncThunkStatus({
            asyncThunk: fetchPools,
            buildStatusPath: () => ['pools', 'all'],
            builder,
        });
    })
}
);

export default swapSlice;

export const actions = {
    fetchPools,
    ...swapSlice.actions
};

export const reducer = swapSlice.reducer;

export const selectPoolsSlice = (state) => state[SLICE_NAME];

const selectPools = createSelector(selectPoolsSlice, ({ pools }) => pools || {});

export const selectPoolsLoading = createSelector(
    [selectPools],
    ({ loading }) => loading
);
