import { useEffect, useState, useMemo } from 'react';

import useDebounce from '../../../../hooks/useDebounce';
import fungibleTokenExchange from '../../../../services/FungibleTokenExchange';
import { decreaseByPercent } from '../../../../utils/amounts';

const initState = {
    amountOut: '',
    minAmountOut: '',
};

export default function useSwapInfo({
    accountId,
    poolsByIds,
    tokenIn,
    amountIn = 0,
    tokenOut,
    delay = 50,
    slippage = 0,
}) {
    const [info, setInfo] = useState(initState);
    const [loading, setLoading] = useState(false);
    const debounceAmountIn = useDebounce(amountIn, delay);

    useEffect(() => {
        let cancelledRequest = false;

        const fetch = async () => {
            if (
                tokenIn &&
                tokenOut &&
                poolsByIds &&
                parseInt(debounceAmountIn) > 0
            ) {
                setLoading(true);

                try {
                    const estimated = await fungibleTokenExchange.estimate({
                        accountId,
                        poolsByIds,
                        tokenIn,
                        amountIn: debounceAmountIn,
                        tokenOut,
                    });
    
                    if (!cancelledRequest) {
                        setInfo(estimated);
                    }
                } catch (error) {
                    console.error(error);
                    setInfo(initState);
                }

                setLoading(false);
            } else {
                setInfo(initState);
            }
        };

        fetch();

        return () => {
            cancelledRequest = true;
        };
    }, [debounceAmountIn, accountId, poolsByIds, tokenIn, tokenOut]);

    const minAmountOut = useMemo(() => {
        if (typeof slippage === 'number' && tokenOut && info.amountOut) {
            return decreaseByPercent(
                info.amountOut,
                slippage,
                tokenOut.onChainFTMetadata.decimals
            );
        }

        return '';
    }, [slippage, tokenOut, info]);

    return { info: { ...info, minAmountOut }, loading };
}
