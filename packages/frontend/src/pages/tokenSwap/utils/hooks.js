import { useEffect, useState } from 'react';

import useDebounce from '../../../hooks/useDebounce';
import fungibleTokenExchange from '../../../services/FungibleTokenExchange';

const AMOUNT_OUT_INIT_STATE = '';

export function useReturn({
    accountId,
    poolId,
    tokenIn,
    amountIn = 0,
    tokenOut,
    delay = 50,
}) {
    const [amountOut, setAmountOut] = useState(AMOUNT_OUT_INIT_STATE);
    const [loading, setLoading] = useState(false);
    const debounceAmountIn = useDebounce(amountIn, delay);

    useEffect(() => {
        let cancelledRequest = false;

        const fetch = async () => {
            if (
                tokenIn &&
                tokenOut &&
                typeof poolId === 'number' &&
                parseInt(debounceAmountIn) > 0
            ) {
                setLoading(true);

                try {
                    const amount = await fungibleTokenExchange.estimate({
                        accountId,
                        poolId,
                        tokenIn,
                        amountIn: debounceAmountIn,
                        tokenOut,
                    });
    
                    if (!cancelledRequest) {
                        setAmountOut(amount);
                    }
                } catch (error) {
                    console.error(error);
                    setAmountOut(AMOUNT_OUT_INIT_STATE);
                }

                setLoading(false);
            } else if (amountOut !== AMOUNT_OUT_INIT_STATE) {
                setAmountOut(AMOUNT_OUT_INIT_STATE);
            }
        };

        fetch();

        return () => {
            cancelledRequest = true;
        };
    }, [debounceAmountIn, accountId, poolId, tokenIn, tokenOut]);

    return { amountOut, loading };
}
