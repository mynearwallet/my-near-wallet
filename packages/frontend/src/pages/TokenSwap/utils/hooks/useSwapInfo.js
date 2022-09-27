import { useEffect, useState, useMemo } from 'react';

import useDebounce from '../../../../hooks/useDebounce';
import fungibleTokenExchange from '../../../../services/tokenExchange';
import { useSwapData } from '../../model/Swap';
import usePools from './usePools';

const IMPOSSIBLE_POOL_ID = -1;

export default function useSwapInfo({
    account,
    tokenIn,
    amountIn = 0,
    tokenOut,
    delay = 50,
}) {
    const {
        events: {
            setAmountOut,
            setSwapPoolId,
            setSwapFee,
            setPriceImpactPercent,
            setIsNearTransformation,
        },
    } = useSwapData();

    const [loading, setLoading] = useState(false);
    const debounceAmountIn = useDebounce(amountIn, delay);
    const isNearTransformation = useMemo(
        () => {
            if (tokenIn && tokenOut) {
                return fungibleTokenExchange.isNearTransformation({ tokenIn, tokenOut });
            }

            return false;
        },
        [tokenIn, tokenOut]
    );

    useEffect(
        () => setIsNearTransformation(isNearTransformation),
        [isNearTransformation]
    );

    const { pools, poolsLoading } = usePools({
        tokenIn,
        tokenOut,
    });

    const [swapNotification, setSwapNotification] = useState(null);

    useEffect(() => {
        if (tokenIn && tokenOut && !pools && !poolsLoading && !isNearTransformation) {
            setAmountOut('');
            setSwapNotification({
                id: 'swap.noPoolAvailable',
                type: 'warning',
                data: {
                    tokenIn: tokenIn.onChainFTMetadata.symbol,
                    tokenOut: tokenOut.onChainFTMetadata.symbol,
                },
            });
        } else if (swapNotification) {
            setSwapNotification(null);
        }
    }, [tokenIn, tokenOut, pools, poolsLoading, isNearTransformation]);

    useEffect(() => {
        let cancelledRequest = false;

        const fetch = async () => {
            if (
                tokenIn &&
                tokenOut &&
                (pools || isNearTransformation) &&
                debounceAmountIn > 0
            ) {
                setLoading(true);

                try {
                    const { amountOut, poolId, swapFee, priceImpactPercent } = await fungibleTokenExchange.estimate({
                        account,
                        poolsByIds: pools,
                        tokenIn,
                        amountIn: debounceAmountIn,
                        tokenOut,
                    });

                    if (!cancelledRequest) {
                        setSwapPoolId(poolId);
                        setAmountOut(amountOut);
                        setSwapFee(swapFee);
                        setPriceImpactPercent(priceImpactPercent);
                    }
                } catch (error) {
                    console.error('Fail to get swap info', error);
                }

                setLoading(false);
            } else if (debounceAmountIn <= 0) {
                setSwapPoolId(IMPOSSIBLE_POOL_ID);
                setSwapFee(0);
                setAmountOut('');
                setPriceImpactPercent('');
            }
        };

        fetch();

        return () => {
            cancelledRequest = true;
        };
    }, [debounceAmountIn, account, pools, tokenIn, tokenOut, isNearTransformation]);

    return {
        swapNotification,
        loading,
    };
}
