import { useEffect, useState, useMemo } from 'react';

import { NEAR_TOKEN_ID } from '../../../../config';
import useDebounce from '../../../../hooks/useDebounce';
import fungibleTokenExchange from '../../../../services/tokenExchange';
import { decreaseByPercent } from '../../../../utils/amounts';
import usePools from './usePools';

const initState = {
    poolId: '',
    amountOut: '',
    minAmountOut: '',
};

const isNearTransformation = (token0, token1) => {
    return (
        (token0?.contractName === 'NEAR' &&
            token1?.contractName === NEAR_TOKEN_ID) ||
        (token1?.contractName === 'NEAR' &&
            token0?.contractName === NEAR_TOKEN_ID)
    );
};

export default function useSwapInfo({
    accountId,
    tokenIn,
    amountIn = 0,
    tokenOut,
    delay = 50,
    slippage = 0,
}) {
    const [info, setInfo] = useState(initState);
    const [loading, setLoading] = useState(false);
    const [isTransformation] = useState(isNearTransformation(tokenIn, tokenOut));
    const debounceAmountIn = useDebounce(amountIn, delay);

    const pools = usePools({
        token0Id: tokenIn?.contractName === 'NEAR' ? NEAR_TOKEN_ID : tokenIn?.contractName,
        token1Id: tokenOut?.contractName === 'NEAR' ? NEAR_TOKEN_ID : tokenOut?.contractName,
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
                        accountId,
                        poolsByIds: pools,
                        tokenIn,
                        amountIn: debounceAmountIn,
                        tokenOut,
                    });
    
                    if (!cancelledRequest) {
                        setInfo({ amountOut, poolId, minAmountOut: '' });
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
    }, [debounceAmountIn, accountId, pools, tokenIn, tokenOut]);

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

    return { info: { ...info, isNearTransformation, minAmountOut }, loading };
}
