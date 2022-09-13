import { useEffect, useState, useMemo } from 'react';

import { NEAR_TOKEN_ID } from '../../../../config';
import useDebounce from '../../../../hooks/useDebounce';
import fungibleTokenExchange from '../../../../services/tokenExchange';
import usePools from './usePools';

const isNearTransformation = (token0, token1) => {
    return (
        (token0?.contractName === 'NEAR' &&
            token1?.contractName === NEAR_TOKEN_ID) ||
        (token1?.contractName === 'NEAR' &&
            token0?.contractName === NEAR_TOKEN_ID)
    );
};

export default function useSwapInfo({
    account,
    tokenIn,
    amountIn = 0,
    tokenOut,
    delay = 50,
}) {
    const [poolId, setPoolId] = useState(-1);
    const [amountOut, setAmountOut] = useState('');
    const [loading, setLoading] = useState(false);
    const debounceAmountIn = useDebounce(amountIn, delay);
    const isTransformation = useMemo(
        () => isNearTransformation(tokenIn, tokenOut),
        [tokenIn, tokenOut]
    );

    const pools = usePools({
        tokenIn: tokenIn?.contractName === 'NEAR' ? NEAR_TOKEN_ID : tokenIn?.contractName,
        tokenOut: tokenOut?.contractName === 'NEAR' ? NEAR_TOKEN_ID : tokenOut?.contractName,
    });

    useEffect(() => {
        let cancelledRequest = false;

        const fetch = async () => {
            if (
                tokenIn &&
                tokenOut &&
                (pools || isTransformation) &&
                parseInt(debounceAmountIn) > 0
            ) {
                setLoading(true);

                try {
                    const { amountOut, poolId } = await fungibleTokenExchange.estimate({
                        account,
                        poolsByIds: pools,
                        tokenIn,
                        amountIn: debounceAmountIn,
                        tokenOut,
                    });
    
                    if (!cancelledRequest) {
                        setPoolId(poolId);
                        setAmountOut(amountOut);
                    }
                } catch (error) {
                    console.error(error);
                }

                setLoading(false);
            }
        };

        fetch();

        return () => {
            cancelledRequest = true;
        };
    }, [debounceAmountIn, account, pools, tokenIn, tokenOut]);

    return { poolId, amountOut, isNearTransformation, loading };
}
