import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { showCustomAlert } from '../../../../redux/actions/status';
import { actions } from '../../../../redux/slices/swap';
import fungibleTokenExchange from '../../../../services/tokenExchange';
import { useSwapData, VIEW_STATE } from '../../model/Swap';

const { updateTokensBalance } = actions;

export default function useSwap({
    account,
    amountIn,
    poolId,
    tokenIn,
    tokenOut,
    minAmountOut,
    isNearTransformation,
}) {
    const dispatch = useDispatch();
    const {
        events: { setSwapPending, setCompletedSwapState, setViewState },
    } = useSwapData();

    const swap = useMemo(() => {
        if (
            !account ||
            !amountIn ||
            (!isNearTransformation && !poolId) ||
            !tokenIn ||
            !tokenOut ||
            !minAmountOut
        ) {
            return null;
        }

        return async () => {
            setSwapPending(true);

            try {
                const { swapTxHash, success } = await fungibleTokenExchange.swap({
                    account,
                    amountIn,
                    poolId,
                    tokenIn,
                    tokenOut,
                    minAmountOut,
                });

                dispatch(
                    updateTokensBalance({
                        accountId: account.accountId,
                        tokenIds: [
                            fungibleTokenExchange.replaceNearIdIfNecessary(
                                tokenIn.contractName
                            ),
                            fungibleTokenExchange.replaceNearIdIfNecessary(
                                tokenOut.contractName
                            ),
                        ],
                    })
                );
                setCompletedSwapState({
                    success,
                    hash: swapTxHash,
                    tokenIn: tokenIn.onChainFTMetadata.symbol,
                    tokenOut: tokenOut.onChainFTMetadata.symbol,
                });
                setViewState(VIEW_STATE.result);
            } catch (error) {
                dispatch(
                    showCustomAlert({
                        success: false,
                        messageCodeHeader: 'swap.error',
                        errorMessage: error.message,
                    })
                );
            }

            setSwapPending(false);
        };
    }, [
        dispatch,
        account,
        amountIn,
        poolId,
        tokenIn,
        tokenOut,
        minAmountOut,
        isNearTransformation,
    ]);

    return swap;
}
