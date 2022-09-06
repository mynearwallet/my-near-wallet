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

export default function usePools({ token0Id, token1Id }) {
    const { pools: { all, loading } } = useSelector(selectPoolsSlice);
    const [pools, setPools] = useState(null);

    useEffect(() => {
        if (token0Id && token1Id && !loading) {
            const poolsById = retrievePools(all, [
                JSON.stringify([token0Id, token1Id]),
                JSON.stringify([token1Id, token0Id]),
            ]);

            setPools(poolsById);
        }
    }, [token0Id, token1Id]);

    return pools;
}
