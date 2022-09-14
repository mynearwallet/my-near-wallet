import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectAllPools, selectPoolsLoading } from '../../../../redux/slices/swap';

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
    const loading = useSelector(selectPoolsLoading);

    const pools = useMemo(() => {
        if (tokenIn && tokenOut && !loading) {
            return retrievePools(allPools, [
                JSON.stringify([tokenIn, tokenOut]),
                JSON.stringify([tokenOut, tokenIn]),
            ]);
        }

        return null;
    }, [tokenIn, tokenOut]);

    return pools;
}
