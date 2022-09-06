import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectPoolsSlice } from '../../../../redux/slices/swap';

export default function usePools({ tokenInId, tokenOutId }) {
    const { pools: { all, loading } } = useSelector(selectPoolsSlice);
    const [pools, setPools] = useState(null);

    useEffect(() => {
        if (tokenOutId && tokenOutId && !loading) {
            const poolsById = all[JSON.stringify([tokenInId, tokenOutId])];
    
            if (poolsById && Object.keys(poolsById).length > 0) {
                setPools(poolsById);
            } else {
                setPools(null);
            }
        }
    }, [tokenInId, tokenOutId]);

    return pools;
}
