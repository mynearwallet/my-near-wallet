import { useEffect, useState, useMemo } from 'react';

import { NEAR_ID, NEAR_TOKEN_ID } from '../../../../config';
import useDebounce from '../../../../hooks/useDebounce';
import fungibleTokenExchange from '../../../../services/tokenExchange';
import usePools from './usePools';

const isNearTransformation = (token0, token1) => {
    return (
        (token0?.contractName === NEAR_ID &&
            token1?.contractName === NEAR_TOKEN_ID) ||
        (token1?.contractName === NEAR_ID &&
            token0?.contractName === NEAR_TOKEN_ID)
    );
};

const IMPOSSIBLE_POOL_ID = -1;

export default function useSwapInfo({
    account,
    tokenIn,
    amountIn = 0,
    tokenOut,
    delay = 50,
}) {
    const [poolId, setPoolId] = useState(IMPOSSIBLE_POOL_ID);
    const [amountOut, setAmountOut] = useState('');
    const [swapFee, setSwapFee] = useState(0);
    const [loading, setLoading] = useState(false);
    const debounceAmountIn = useDebounce(amountIn, delay);
    const isTransformation = useMemo(
        () => isNearTransformation(tokenIn, tokenOut),
        [tokenIn, tokenOut]
    );

    const pools = usePools({
        tokenIn: tokenIn?.contractName === NEAR_ID ? NEAR_TOKEN_ID : tokenIn?.contractName,
        tokenOut: tokenOut?.contractName === NEAR_ID ? NEAR_TOKEN_ID : tokenOut?.contractName,
    });

    useEffect(() => {
        let cancelledRequest = false;

        const fetch = async () => {
            if (
                tokenIn &&
                tokenOut &&
                (pools || isTransformation) &&
                debounceAmountIn > 0
            ) {
                setLoading(true);

                try {
                    const { amountOut, poolId, swapFee } = await fungibleTokenExchange.estimate({
                        account,
                        poolsByIds: pools,
                        tokenIn,
                        amountIn: debounceAmountIn,
                        tokenOut,
                    });

                    if (!cancelledRequest) {
                        setPoolId(poolId);
                        setAmountOut(amountOut);
                        setSwapFee(swapFee);
                    }
                } catch (error) {
                    console.error('Fail to get swap info', error);
                }

                setLoading(false);
            } else if (debounceAmountIn <= 0) {
                setPoolId(IMPOSSIBLE_POOL_ID);
                setAmountOut('');
            }
        };

        fetch();

        return () => {
            cancelledRequest = true;
        };
    }, [debounceAmountIn, account, pools, tokenIn, tokenOut]);

    return { poolId, swapFee, amountOut, isNearTransformation, loading };
}
