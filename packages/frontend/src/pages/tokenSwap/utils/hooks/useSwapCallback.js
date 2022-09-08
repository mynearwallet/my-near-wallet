import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { showCustomAlert } from '../../../../redux/actions/status';
import fungibleTokenExchange from '../../../../services/tokenExchange';

export default function useSwapCallback({
    accountId,
    amountIn,
    poolId,
    tokenIn,
    tokenOut,
    minAmountOut,
    isNearTransformation,
}) {
    const dispatch = useDispatch();
    const [pending, setPending] = useState(false);

    const callback = useCallback(() => {
        if (
            !accountId ||
            !amountIn ||
            (!isNearTransformation && !poolId) ||
            !tokenIn ||
            !tokenOut ||
            !minAmountOut
        ) {
            return;
        }

        setPending(true);

        fungibleTokenExchange
            .swap({
                accountId,
                amountIn,
                poolId,
                tokenIn,
                tokenOut,
                minAmountOut,
            })
            .then((result) => {
                // @note result is an array of swap transactions
                // what could we show in a notification, especially in case of many txs?
                dispatch(
                    showCustomAlert({
                        success: true,
                        messageCodeHeader: 'swap.success',
                        // @note is there a way different way to show custom data?
                        errorMessage: `${tokenIn.contractName} to ${tokenOut.contractName}`,
                    })
                );
            })
            .catch((error) => {
                dispatch(
                    showCustomAlert({
                        success: false,
                        messageCodeHeader: 'swap.error',
                        errorMessage: error.message,
                    })
                );
            })
            .finally(() => {
                setPending(false);
            });
    }, [
        dispatch,
        accountId,
        amountIn,
        poolId,
        tokenIn,
        tokenOut,
        minAmountOut,
        isNearTransformation,
    ]);

    return { callback, pending };
}
