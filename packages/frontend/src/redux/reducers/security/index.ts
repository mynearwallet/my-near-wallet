import { createSelector } from '@reduxjs/toolkit';

import { Action, StateAction } from '../../createReducers';

export type SecurityState = {
    isAuthorizedByPassword: boolean;
    blacklistedTokens: string[],
    setOfBlacklistedTokenNames: Set<string>,
}

const SET_AUTHORIZED_BY_PASSWORD = 'security/SET_AUTHORIZED_BY_PASSWORD';
const SET_BLACKLISTED_TOKENS = 'security/SET_BLACKLISTED_TOKENS';
const SET_BLACKLISTED_TOKEN_NAMES = 'security/SET_BLACKLISTED_TOKEN_NAMES';

type SecurityStateActions =
    StateAction<typeof SET_AUTHORIZED_BY_PASSWORD, boolean> |
    StateAction<typeof SET_BLACKLISTED_TOKENS, string[]> |
    StateAction<typeof SET_BLACKLISTED_TOKEN_NAMES, Set<string>> ;


export const setAuthorizedByPassword: Action<boolean> = (payload) => ({
    type: SET_AUTHORIZED_BY_PASSWORD,
    payload,
});

export const setBlacklistedTokens: Action<string[]> = (payload) => ({
    type: SET_BLACKLISTED_TOKENS,
    payload,
});

export const setBlacklistedTokenNames: Action<Set<string>> = (payload) => ({
    type: SET_BLACKLISTED_TOKEN_NAMES,
    payload,
});

const initialState: SecurityState = {
    isAuthorizedByPassword: false,
    blacklistedTokens: [],
    setOfBlacklistedTokenNames: new Set(),
};

export default (
    state = initialState,
    action: SecurityStateActions
): SecurityState => {
    switch (action.type) {
        case SET_AUTHORIZED_BY_PASSWORD:
            return {
                ...state,
                isAuthorizedByPassword: action.payload,
            };
        case SET_BLACKLISTED_TOKENS:
            return {
                ...state,
                blacklistedTokens: action.payload,
            };
        case SET_BLACKLISTED_TOKEN_NAMES:
            return {
                ...state,
                setOfBlacklistedTokenNames: action.payload,
            };
        default:
            return state;
    }
};

// TODO: @NotEternal please refactor
const selectSecuritySlice = (state) => state.security;

export const selectSetOfBlacklistedTokenNames = createSelector(
    selectSecuritySlice,
    (state) => state.setOfBlacklistedTokenNames
);
