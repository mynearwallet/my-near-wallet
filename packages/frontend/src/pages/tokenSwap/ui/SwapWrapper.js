import React, { useState, useMemo } from 'react';

import Success from '../../../components/swap/components/Success';
import { SwapReviewForm } from '../../../components/swap/components/SwapReviewForm';
import { decreaseByPercent } from '../../../utils/amounts';
import { useSwapData, VIEW_STATE } from '../model/Swap';
import useSwap from '../utils/hooks/useSwap';
import SwapForm from './SwapForm';

export default function SwapWrapper({ history, account, userTokens }) {
    const {
        swapState: {
            viewState,
            tokenIn,
            amountIn,
            tokenOut,
            amountOut,
            swapPoolId,
            isNearTransformation,
        },
        events: { setViewState },
    } = useSwapData();

    const goHome = () => history.push('/');
    const showForm = () => setViewState(VIEW_STATE.inputForm);

    const [slippage, setSlippage] = useState(0);
    const minAmountOut = useMemo(() => {
        // if (
        //     typeof slippage === 'number' &&
        //     tokenOut?.onChainFTMetadata?.decimals &&
        //     amountOut
        // ) {
        //     if (!slippage) {
        //         return amountOut;
        //     }

        //     return decreaseByPercent(
        //         amountOut,
        //         slippage,
        //         tokenOut.onChainFTMetadata.decimals
        //     );
        // }

        return '';
    }, [slippage, tokenOut, amountOut]);

    const exchangeRate = useMemo(() => {
        if (amountIn && amountOut) {
            return amountIn / amountOut;
        }

        return 1;
    }, [amountIn, amountOut]);

    const { swap } = useSwap({
        account,
        amountIn,
        poolId: swapPoolId,
        tokenIn,
        tokenOut,
        minAmountOut,
        isNearTransformation,
    });

    const handleSwap = swap();

    return viewState === VIEW_STATE.inputForm ? (
        <SwapForm onGoBack={goHome} account={account} userTokens={userTokens} />
    ) : viewState === VIEW_STATE.preview ? (
        <SwapReviewForm
            onClickGoBack={showForm}
            amountTokenFrom={amountIn}
            amountTokenTo={amountOut}
            activeTokenFrom={tokenIn}
            activeTokenTo={tokenOut}
            accountId={account.accountId}
            handleSwapToken={handleSwap}
            exchangeRate={exchangeRate}
            tradingFee={0}
            setSlippage={setSlippage}
            showSlippageOption
        />
    ) : viewState === VIEW_STATE.result ? (
        <Success
            amountFrom={amountIn}
            amountTo={amountOut}
            onClickContinue={showForm}
            // transactionHash={}
            // onClickGoToExplorer={}
        />
    ) : null;
}
