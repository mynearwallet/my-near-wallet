import { createSlice } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';

const SLICE_NAME = 'externalRedirect';

const externalRedirectSlice = createSlice({
    name: SLICE_NAME,
    initialState: { pendingUrl: null },
    reducers: {
        showExternalRedirect: (state, action) => {
            state.pendingUrl = action.payload;
        },
        clearExternalRedirect: (state) => {
            state.pendingUrl = null;
        },
    },
});

export default externalRedirectSlice;
export const actions = { ...externalRedirectSlice.actions };
export const reducer = externalRedirectSlice.reducer;

const selectSlice = (state) => state[SLICE_NAME];
export const selectPendingExternalRedirectUrl = createSelector(
    selectSlice,
    (s) => s.pendingUrl
);
