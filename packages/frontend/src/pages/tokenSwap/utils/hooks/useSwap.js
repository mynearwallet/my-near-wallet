import { useState, useMemo } from 'react';
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
    const [pending, setPending] = useState(false);
    const { events } = useSwapData();

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
            setPending(true);

            try {
                const { swapTxHash } = await fungibleTokenExchange.swap({
                    account,
                    amountIn,
                    poolId,
                    tokenIn,
                    tokenOut,
                    minAmountOut,
                });

                events.setLastSwapTxHash(swapTxHash);
                events.setViewState(VIEW_STATE.result);

                dispatch(
                    updateTokensBalance({
                        accountId: account.accountId,
                        tokenIds: [tokenIn.contractName, tokenOut.contractName],
                    })
                );
                // we show a swap result page if this page is mounted
                // @todo how to show this alert when it's unmounted?
                dispatch(
                    showCustomAlert({
                        success: true,
                        messageCodeHeader: 'swap.success',
                        // @note is there a way different way to show custom data?
                        errorMessage: `${tokenIn.contractName} to ${tokenOut.contractName}`,
                    })
                );
            } catch (error) {
                dispatch(
                    showCustomAlert({
                        success: false,
                        messageCodeHeader: 'swap.error',
                        errorMessage: error.message,
                    })
                );
            }

            setPending(false);
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

    return { swap, pending };
}
