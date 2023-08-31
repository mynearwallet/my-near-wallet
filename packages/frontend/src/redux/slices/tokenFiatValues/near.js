import { createSelector } from 'reselect';

const SLICE_NAME = 'tokenFiatValues';
export const selectAllTokenFiatValues = (state) => state[SLICE_NAME];

export const selectNearTokenFiatData = createSelector(
    selectAllTokenFiatValues,
    ({ tokens }) => tokens.near || {}
);

export const selectNearTokenFiatValueUSD = createSelector(
    selectNearTokenFiatData,
    (near) => near.usd
);
