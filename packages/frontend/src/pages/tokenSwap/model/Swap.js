import React, { createContext, useReducer, useMemo, useContext } from 'react';

export const VIEW_STATE = {
    inputForm: 'inputForm',
    preview: 'preview',
    result: 'result',
};

export const initialState = {
    viewState: VIEW_STATE.inputForm,
    tokenIn: null,
    amountIn: '',
    tokenOut: null,
    amountOut: '',
    swapPool: null,
    minAmountOut: '',
    isNearTransformation: false,
};

export const ACTION = {
    SET_VIEW_STATE: 'setViewState',
    SET_TOKEN_IN: 'setTokenIn',
    SET_TOKEN_OUT: 'setTokenOut',
    SET_AMOUNT_IN: 'setAmountIn',
    SET_AMOUNT_OUT: 'setAmountOut',
    SET_SWAP_POOL: 'setSwapPool',
    SET_MIN_AMOUNT_OUT: 'setMinAmountOut',
    SET_IS_NEAR_TRANSFORMATION: 'setIsNearTransformation',
};

export function swapReducer(state, action) {
    const payload = action.payload;

    switch (action.type) {
        case ACTION.SET_VIEW_STATE:
            return { ...state, viewState: payload };
        case ACTION.SET_TOKEN_IN:
            return { ...state, tokenIn: payload };
        case ACTION.SET_TOKEN_OUT:
            return { ...state, tokenOut: payload };
        case ACTION.SET_AMOUNT_IN:
            return { ...state, amountIn: payload };
        case ACTION.SET_AMOUNT_OUT:
            return { ...state, amountOut: payload };
        case ACTION.SET_SWAP_POOL:
            return { ...state, swapPool: payload };
        case ACTION.SET_MIN_AMOUNT_OUT:
            return { ...state, minAmountOut: payload };
        case ACTION.SET_IS_NEAR_TRANSFORMATION:
            return { ...state, isNearTransformation: payload };
        default:
            return state;
    }
}

const SwapContext = createContext(null);

export const useSwapData = () => {
    const context = useContext(SwapContext);

    if (context === undefined) {
        throw new Error('useSwapData must be used within a Provider');
    }

    return context;
};

export function SwapProvider({ children }) {
    const [swapState, dispatch] = useReducer(swapReducer, initialState);

    const events = useMemo(() => {
        return {
            setViewState: (payload) => {
                dispatch({ type: ACTION.SET_VIEW_STATE, payload });
            },
            setTokenIn: (payload) => {
                dispatch({ type: ACTION.SET_TOKEN_IN, payload });
            },
            setTokenOut: (payload) => {
                dispatch({ type: ACTION.SET_TOKEN_OUT, payload });
            },
            setAmountIn: (payload) => {
                dispatch({ type: ACTION.SET_AMOUNT_IN, payload });
            },
            setAmountOut: (payload) => {
                dispatch({ type: ACTION.SET_AMOUNT_OUT, payload });
            },
            setSwapPool: (payload) => {
                dispatch({ type: ACTION.SET_SWAP_POOL, payload });
            },
            setMinAmountOut: (payload) => {
                dispatch({ type: ACTION.SET_MIN_AMOUNT_OUT, payload });
            },
            setIsNearTransformation: (payload) => {
                dispatch({ type: ACTION.SET_IS_NEAR_TRANSFORMATION, payload });
            },
        };
    }, []);

    return (
        <SwapContext.Provider value={{ swapState, events }}>
            {children}
        </SwapContext.Provider>
    );
}
