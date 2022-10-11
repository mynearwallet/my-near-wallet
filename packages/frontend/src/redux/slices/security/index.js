import {
    createAsyncThunk,
    createSlice,
    createSelector,
} from '@reduxjs/toolkit';
import set from 'lodash.set';
import { batch } from 'react-redux';

import { fetchBlacklistedTokens } from '../../../services/security/tokens';

const SLICE_NAME = 'security';

const initialState = {
    blacklistedTokens: [],
    blacklistedTokenNames: [], 
};

const initializeBlacklistedTokens = createAsyncThunk(
    `${SLICE_NAME}/initializeBlacklistedTokens`,
    async (_, thunkAPI) => {
        const { dispatch } = thunkAPI;
        const {
            actions: { setBlacklistedTokens, setBlacklistedTokenNames },
        } = securitySlice;

        try {
            const blacklisted = await fetchBlacklistedTokens();

            if (blacklisted.length) {
                batch(() => {
                    dispatch(setBlacklistedTokens(blacklisted));
                    dispatch(
                        setBlacklistedTokenNames(
                            blacklisted.map(({ address }) => address)
                        )
                    );
                });
            }
        } catch (error) {
            console.error('Error on fetching blacklisted tokens', error);
        }
    }
);

const securitySlice = createSlice({
    name: SLICE_NAME,
    initialState,
    reducers: {
        setBlacklistedTokens(state, { payload }) {
            set(state, ['blacklistedTokens'], payload);
        },
        setBlacklistedTokenNames(state, { payload }) {
            set(state, ['blacklistedTokenNames'], payload);
        },
    },
});

export default securitySlice;

export const actions = {
    initializeBlacklistedTokens,
    ...securitySlice.actions,
};

const selectSecuritySlice = (state) => state[SLICE_NAME];

export const selectBlacklistedTokens = createSelector(
    selectSecuritySlice,
    (state) => state.blacklistedTokens
);

export const selectBlacklistedTokenNames = createSelector(
    selectSecuritySlice,
    (state) => state.blacklistedTokenNames
);
