import React, {
    createContext,
    useReducer,
    useMemo,
    useContext,
    useCallback,
} from 'react';
import { useDispatch } from 'react-redux';

import useIsMounted from '../../../hooks/useIsMounted';
import { showCustomAlert } from '../../../redux/actions/status';
import { DEFAULT_SLIPPAGE_PERCENT } from '../utils/constants';

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
    estimatedFee: 0,
    slippage: DEFAULT_SLIPPAGE_PERCENT,
    priceImpactPercent: '',
    swapPoolId: null,
    isNearTransformation: false,
    lastSwapState: null,
    swapPending: false,
};

const ACTION = {
    SET_VIEW_STATE: 'setViewState',
    SET_TOKEN_IN: 'setTokenIn',
    SET_TOKEN_OUT: 'setTokenOut',
    SET_AMOUNT_IN: 'setAmountIn',
    SET_AMOUNT_OUT: 'setAmountOut',
    SET_SWAP_POOL_ID: 'setSwapPoolId',
    SET_SWAP_FEE: 'setSwapFee',
    SET_ESTIMATED_FEE: 'setEstimatedFee',
    SET_SLIPPAGE: 'setSlippage',
    SET_PRICE_IMPACT_PERCENT: 'setPriceImpactPercent',
    SET_IS_NEAR_TRANSFORMATION: 'setIsNearTransformation',
    SET_SWAP_PENDING: 'setSwapPending',
    SET_COMPLETED_SWAP_STATE: 'setCompletedSwapState',
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
        case ACTION.SET_ESTIMATED_FEE:
            return { ...state, estimatedFee: payload };
        case ACTION.SET_SLIPPAGE:
            return { ...state, slippage: payload };
        case ACTION.SET_PRICE_IMPACT_PERCENT:
            return { ...state, priceImpactPercent: payload };
        case ACTION.SET_IS_NEAR_TRANSFORMATION:
            return { ...state, isNearTransformation: payload };
        case ACTION.SET_SWAP_PENDING:
            return { ...state, swapPending: payload };
        case ACTION.SET_COMPLETED_SWAP_STATE:
            return { ...state, lastSwapState: payload };
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
    const dispatch = useDispatch();
    const isMounted = useIsMounted();
    const [swapState, dispatchSwapAction] = useReducer(swapReducer, initialState);

    const dispatchIfMounted = useCallback((type, payload) => {
        if (isMounted()) {
            dispatchSwapAction({ type, payload });
        } else if (type === ACTION.SET_COMPLETED_SWAP_STATE) {
            const { success, tokenIn, tokenOut } = payload;

            dispatch(
                showCustomAlert({
                    success,
                    messageCodeHeader: success ? 'swap.success' : 'swap.error',
                    // @note is there a different way to show custom data
                    // instead of 'errorMessage' key?
                    errorMessage: `${tokenIn} to ${tokenOut}`,
                })
            );
        }
    }, [isMounted]);

    const events = useMemo(
        () => ({
            setViewState(payload) {
                dispatchIfMounted(ACTION.SET_VIEW_STATE, payload);
            },
            setTokenIn(payload = null) {
                dispatchSwapAction({ type: ACTION.SET_TOKEN_IN, payload });
            },
            setTokenOut(payload = null) {
                dispatchSwapAction({ type: ACTION.SET_TOKEN_OUT, payload });
            },
            setAmountIn(payload) {
                dispatchSwapAction({ type: ACTION.SET_AMOUNT_IN, payload });
            },
            setAmountOut(payload) {
                dispatchIfMounted(ACTION.SET_AMOUNT_OUT, payload);
            },
            setSwapPoolId(payload) {
                dispatchIfMounted(ACTION.SET_SWAP_POOL_ID, payload);
            },
            setSwapFee(payload) {
                dispatchIfMounted(ACTION.SET_SWAP_FEE, payload);
            },
            setEstimatedFee(payload) {
                dispatchIfMounted(ACTION.SET_ESTIMATED_FEE, payload);
            },
            setSlippage(payload) {
                dispatchIfMounted(ACTION.SET_SLIPPAGE, payload);
            },
            setPriceImpactPercent(payload) {
                dispatchIfMounted(ACTION.SET_PRICE_IMPACT_PERCENT, payload);
            },
            setIsNearTransformation(payload) {
                dispatchIfMounted(ACTION.SET_IS_NEAR_TRANSFORMATION, payload);
            },
            setSwapPending(payload) {
                dispatchIfMounted(ACTION.SET_SWAP_PENDING, payload);
            },
            setCompletedSwapState(payload) {
                dispatchIfMounted(ACTION.SET_COMPLETED_SWAP_STATE, payload);
            },
        }),
        []
    );

    const contextValue = useMemo(() => ({ swapState, events }), [swapState]);

    return (
        <SwapContext.Provider value={contextValue}>
            {children}
        </SwapContext.Provider>
    );
}
