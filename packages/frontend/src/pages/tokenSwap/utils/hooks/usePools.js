import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectPoolsSlice } from '../../../../redux/slices/swap';

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
    const { all, loading } = useSelector(selectPoolsSlice);
    const [pools, setPools] = useState(null);

    useEffect(() => {
        if (tokenIn && tokenOut && !loading) {
            const poolsById = retrievePools(all, [
                JSON.stringify([tokenIn, tokenOut]),
                JSON.stringify([tokenOut, tokenIn]),
            ]);

            setPools(poolsById);
        }
    }, [tokenIn, tokenOut]);

    return pools;
}
