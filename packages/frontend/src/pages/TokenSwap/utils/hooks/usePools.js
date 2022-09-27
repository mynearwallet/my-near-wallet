import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    selectAllPools,
    selectPoolsLoading,
} from '../../../../redux/slices/swap';
import fungibleTokenExchange from '../../../../services/tokenExchange';
import { formatTokenAmount } from '../../../../utils/amounts';

const MIN_FIAT_LIQUIDITY_THRESHOLD = 1_000;

const filterPools = ({
    allRelatedPools,
    tokenInId,
    tokenInDecimals,
    tokenInFiatCourse,
    tokenOutId,
    tokenOutDecimals,
    tokenOutFiatCourse,
}) => {
    const filtered = Object.entries(allRelatedPools).filter(
        ([key, { token_account_ids, amounts, poolId }]) => {
            const tokenReserve = {
                [token_account_ids[0]]: amounts[0],
                [token_account_ids[1]]: amounts[1],
            };
            const reserveIn = tokenReserve[tokenInId];
            const reserveOut = tokenReserve[tokenOutId];

            const liquidityInUsd =
                reserveIn * tokenInFiatCourse +
                reserveOut * tokenOutFiatCourse;

            const NEAR_DECIMALS = 24;

            return (
                formatTokenAmount(liquidityInUsd, NEAR_DECIMALS, NEAR_DECIMALS) >=
                MIN_FIAT_LIQUIDITY_THRESHOLD
            );
        }
    );

    return filtered.length ? Object.fromEntries(filtered) : null;
};

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

            const allRelatedPools = retrievePools(allPools, [
                JSON.stringify([tokenInId, tokenOutId]),
                JSON.stringify([tokenOutId, tokenInId]),
            ]);

            const {
                fiatValueMetadata: { usd: tokenInFiatCourse },
            } = tokenIn;
            const {
                fiatValueMetadata: { usd: tokenOutFiatCourse },
            } = tokenOut;

            if (
                typeof tokenInFiatCourse === 'number' &&
                typeof tokenOutFiatCourse === 'number' &&
                allRelatedPools
            ) {
                return filterPools({
                    allRelatedPools,
                    tokenInId,
                    tokenInDecimals: tokenIn.onChainFTMetadata.decimals,
                    tokenInFiatCourse,
                    tokenOutId,
                    tokenOutDecimals: tokenOut.onChainFTMetadata.decimals,
                    tokenOutFiatCourse,
                });
            }

            return allRelatedPools;
        }

        return null;
    }, [tokenIn, tokenOut, poolsLoading]);

    return { pools, poolsLoading };
}
