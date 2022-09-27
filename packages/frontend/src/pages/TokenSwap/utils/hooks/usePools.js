import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    selectAllPools,
    selectPoolsLoading,
} from '../../../../redux/slices/swap';
import fungibleTokenExchange from '../../../../services/tokenExchange';

const retrievePools = (allPools, keys) => {
    for (const key of keys) {
        const pools = allPools[key];

        if (pools && Object.keys(pools).length) {
            return pools;
        }
    }

    return null;
};

export default function usePools({ tokenIn, tokenOut }) {
    const allPools = useSelector(selectAllPools);
    const poolsLoading = useSelector(selectPoolsLoading);

    const pools = useMemo(() => {
        if (tokenIn && tokenOut && !poolsLoading) {
            const tokenInId = fungibleTokenExchange.replaceNearIdIfNecessary(
                tokenIn?.contractName
            );
            const tokenOutId = fungibleTokenExchange.replaceNearIdIfNecessary(
                tokenOut?.contractName
            );

            return retrievePools(allPools, [
                JSON.stringify([tokenInId, tokenOutId]),
                JSON.stringify([tokenOutId, tokenInId]),
            ]);
        }

        return null;
    }, [tokenIn, tokenOut, poolsLoading]);

    return { pools, poolsLoading };
}
