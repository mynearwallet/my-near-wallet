import { useEffect, useState } from 'react';

import CONFIG from '../../../../config';
import { useSwapData } from '../../model/Swap';
import { DEFAULT_OUTPUT_TOKEN_ID } from '../constants';

const storageKey = `swapTokenPair:${CONFIG.CURRENT_NEAR_NETWORK}`;

function loadTokenPair() {
    try {
        const pair = JSON.parse(localStorage.getItem(storageKey));
        if (
            typeof pair?.tokenIn === 'string' && pair.tokenIn &&
            typeof pair?.tokenOut === 'string' && pair.tokenOut &&
            pair.tokenIn !== pair.tokenOut
        ) {
            return pair;
        }
    } catch {
        // Token selection still works when browser storage is unavailable.
    }
    return null;
}

export default function useTokenPair({
    tokensIn,
    tokensOut,
    listOfTokensIn,
    listOfTokensOut,
    isLoadingAllTokens,
}) {
    const [savedPair] = useState(loadTokenPair);
    const {
        swapState: { tokenIn, tokenOut },
        events: { setTokenIn, setTokenOut },
    } = useSwapData();

    useEffect(() => {
        if (savedPair && isLoadingAllTokens) {
            return;
        }

        const inputId = tokenIn?.contractName || savedPair?.tokenIn;
        const outputId = tokenOut?.contractName || savedPair?.tokenOut;
        const input = tokensIn[inputId] || tokensOut[inputId] || listOfTokensIn[0];
        const output = [
            tokensOut[outputId],
            tokensOut[DEFAULT_OUTPUT_TOKEN_ID],
            ...listOfTokensOut,
        ].find((token) => token && token.contractName !== input?.contractName);

        setTokenIn(input);
        setTokenOut(output);
    }, [listOfTokensIn, listOfTokensOut, isLoadingAllTokens]);

    const inputId = tokenIn?.contractName;
    const outputId = tokenOut?.contractName;
    useEffect(() => {
        if (isLoadingAllTokens || !inputId || !outputId || inputId === outputId) {
            return;
        }
        try {
            localStorage.setItem(storageKey, JSON.stringify({
                tokenIn: inputId,
                tokenOut: outputId,
            }));
        } catch {
            // Persistence is optional; a storage failure must not block a swap.
        }
    }, [inputId, outputId, isLoadingAllTokens]);
}
