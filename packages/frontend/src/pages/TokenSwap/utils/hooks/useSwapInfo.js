import { useEffect, useMemo, useState } from 'react';

import usePools from './usePools';
import useDebouncedValue from '../../../../hooks/useDebouncedValue';
import fungibleTokenExchange from '../../../../services/tokenExchange';
import { useSwapData } from '../../model/Swap';
import { SWAP_INFO_DELAY, NOTIFICATION_TYPE } from '../constants';

export default function useSwapInfo({
    account,
    tokenIn,
    amountIn = '',
    tokenOut,
    slippage,
    delay = SWAP_INFO_DELAY,
    enabled = true,
    refreshInterval = 0,
}) {
    const {
        events: { setSwapEstimate, setIsNearTransformation },
    } = useSwapData();
    const { pools } = usePools({ tokenIn, tokenOut });
    const isNearTransformation = useMemo(() => tokenIn && tokenOut &&
        fungibleTokenExchange.isNearTransformation({ tokenIn, tokenOut }), [tokenIn, tokenOut]);
    useEffect(() => setIsNearTransformation(!!isNearTransformation), [isNearTransformation]);
    const debouncedAmountIn = useDebouncedValue(amountIn, delay);
    const [loading, setLoading] = useState(false);
    const [refreshVersion, setRefreshVersion] = useState(0);
    const [swapNotification, setSwapNotification] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;

        if (
            !enabled ||
            !account ||
            !tokenIn ||
            !tokenOut ||
            amountIn !== debouncedAmountIn ||
            !Number(debouncedAmountIn)
        ) {
            setLoading(false);
            setSwapNotification(null);
            return () => controller.abort();
        }

        setLoading(true);
        setSwapNotification(null);
        fungibleTokenExchange
            .estimate({
                account,
                tokenIn,
                tokenOut,
                amountIn: debouncedAmountIn,
                slippage,
                poolsByIds: pools,
                signal: controller.signal,
            })
            .then((quote) => {
                if (!cancelled) {
                    setSwapEstimate(quote);
                    console.info(`[Swap] ${quote.v2Quote ? 'SmartRouter V2' : isNearTransformation ? 'NEAR wrap/unwrap' : 'Ref (legacy)'}`, {
                        tokenIn: tokenIn.contractName,
                        tokenOut: tokenOut.contractName,
                        amountIn: debouncedAmountIn,
                        amountOut: quote.amountOut,
                        minAmountOut: quote.v2Quote?.minAmountOut,
                        slippage,
                    });
                }
            })
            .catch((error) => {
                if (cancelled) {
                    return;
                }
                setSwapEstimate(null);
                setSwapNotification({
                    id:
                        error?.code === 'NO_ROUTE'
                            ? 'swap.noPoolAvailable'
                            : 'swap.poolsError',
                    type:
                        error?.code === 'NO_ROUTE'
                            ? NOTIFICATION_TYPE.warning
                            : NOTIFICATION_TYPE.error,
                    data: {
                        tokenIn: tokenIn.onChainFTMetadata.symbol,
                        tokenOut: tokenOut.onChainFTMetadata.symbol,
                    },
                });
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [account, tokenIn, tokenOut, amountIn, debouncedAmountIn, slippage, pools, enabled, refreshVersion]);

    useEffect(() => {
        if (!enabled || !refreshInterval || loading || !Number(amountIn)) {
            return;
        }
        const timer = setTimeout(() => setRefreshVersion((value) => value + 1), refreshInterval);
        return () => clearTimeout(timer);
    }, [enabled, refreshInterval, loading, amountIn, refreshVersion]);

    return {
        swapNotification,
        loading: loading || amountIn !== debouncedAmountIn,
    };
}
