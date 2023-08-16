import { createSelector } from 'reselect';

const SLICE_NAME = 'tokenFiatValues';
export const selectAllTokenFiatValues = (state) => state[SLICE_NAME];

export const selectUSDNTokenFiatData = createSelector(
    selectAllTokenFiatValues,
    ({ tokens }) => tokens.usn || {}
);

export const selectUSDNTokenFiatValueUSD = createSelector(
    selectUSDNTokenFiatData,
    (usn) => usn.usd
);
