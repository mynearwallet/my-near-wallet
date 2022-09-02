import { useEffect, useState } from 'react';

import useDebounce from '../../../hooks/useDebounce';
import fungibleTokenExchange from '../../../services/FungibleTokenExchange';

const AMOUNT_OUT_INIT_STATE = '';

export function useReturn({
    accountId,
    poolId,
    tokenInId,
    amountIn = 0,
    tokenOut,
    delay = 50,
}) {
    const [amountOut, setAmountOut] = useState(AMOUNT_OUT_INIT_STATE);
    const [loading, setLoading] = useState(false);
    const debounceAmountIn = useDebounce(amountIn, delay);

    useEffect(() => {
        const fetch = async () => {
            if (parseInt(debounceAmountIn) > 0) {
                setLoading(true);

                try {
                    const amount = await fungibleTokenExchange.estimateSwap({
                        accountId,
                        poolId,
                        tokenInId,
                        amountIn: debounceAmountIn,
                        tokenOut,
                    });
    
                    setAmountOut(amount);
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
    }, [debounceAmountIn, accountId, poolId, tokenInId, tokenOut]);

    return {amountOut, loading};
}
