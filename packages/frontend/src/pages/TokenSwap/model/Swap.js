import React, { createContext, useReducer, useMemo, useContext } from 'react';

export const VIEW_STATE = {
    inputForm: 'inputForm',
    preview: 'preview',
    result: 'result',
};

const initialState = {
    viewState: VIEW_STATE.inputForm,
    tokenIn: null,
    amountIn: '',
    tokenOut: null,
    amountOut: '',
    swapFee: 0,
    swapPoolId: null,
    isNearTransformation: false,
    lastSwapTxHash: '',
};

const ACTION = {
    SET_VIEW_STATE: 'setViewState',
    SET_TOKEN_IN: 'setTokenIn',
    SET_TOKEN_OUT: 'setTokenOut',
    SET_AMOUNT_IN: 'setAmountIn',
    SET_AMOUNT_OUT: 'setAmountOut',
    SET_SWAP_POOL_ID: 'setSwapPoolId',
    SET_SWAP_FEE: 'setSwapFee',
    SET_IS_NEAR_TRANSFORMATION: 'setIsNearTransformation',
    SET_LAST_SWAP_TX_HASH: 'setLastSwapTxHash',
};

function swapReducer(state, action) {
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
        case ACTION.SET_SWAP_POOL_ID:
            return { ...state, swapPoolId: payload };
        case ACTION.SET_SWAP_FEE:
            return { ...state, swapFee: payload };
        case ACTION.SET_IS_NEAR_TRANSFORMATION:
            return { ...state, isNearTransformation: payload };
        case ACTION.SET_LAST_SWAP_TX_HASH:
            return { ...state, lastSwapTxHash: payload };
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
            setTokenIn: (payload = null) => {
                dispatch({ type: ACTION.SET_TOKEN_IN, payload });
            },
            setTokenOut: (payload = null) => {
                dispatch({ type: ACTION.SET_TOKEN_OUT, payload });
            },
            setAmountIn: (payload) => {
                dispatch({ type: ACTION.SET_AMOUNT_IN, payload });
            },
            setAmountOut: (payload) => {
                dispatch({ type: ACTION.SET_AMOUNT_OUT, payload });
            },
            setSwapPoolId: (payload) => {
                dispatch({ type: ACTION.SET_SWAP_POOL_ID, payload });
            },
            setSwapFee: (payload) => {
                dispatch({ type: ACTION.SET_SWAP_FEE, payload });
            },
            setIsNearTransformation: (payload) => {
                dispatch({ type: ACTION.SET_IS_NEAR_TRANSFORMATION, payload });
            },
            setLastSwapTxHash: (payload) => {
                dispatch({ type: ACTION.SET_LAST_SWAP_TX_HASH, payload });
            },
        };
    }, []);

    const contextValue = useMemo(() => ({ swapState, events }), [swapState]);

    return (
        <SwapContext.Provider value={contextValue}>
            {children}
        </SwapContext.Provider>
    );
}
