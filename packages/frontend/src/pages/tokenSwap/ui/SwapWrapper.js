import React, { memo, useState, useMemo } from 'react';

import Success from '../../../components/swap/components/Success';
import { SwapReviewForm } from '../../../components/swap/components/SwapReviewForm';
import { decreaseByPercent } from '../../../utils/amounts';
import { openTransactionInExplorer } from '../../../utils/window';
import { useSwapData, VIEW_STATE } from '../model/Swap';
import useSwap from '../utils/hooks/useSwap';
import SwapForm from './SwapForm';

export default memo(function SwapWrapper({ history, account, tokens }) {
    const {
        swapState: {
            viewState,
            tokenIn,
            amountIn,
            tokenOut,
            amountOut,
            swapPoolId,
            isNearTransformation,
            lastSwapTxHash,
        },
        events: { setViewState },
    } = useSwapData();

    const goHome = () => history.push('/');
    const showForm = () => setViewState(VIEW_STATE.inputForm);

    const [slippage, setSlippage] = useState(0);
    const minAmountOut = useMemo(() => {
        if (
            typeof slippage === 'number' &&
            tokenOut?.onChainFTMetadata?.decimals &&
            amountOut
        ) {
            if (!slippage) {
                return amountOut;
            }

            return decreaseByPercent(
                amountOut,
                slippage,
                tokenOut.onChainFTMetadata.decimals
            );
        }

        return '';
    }, [slippage, tokenOut, amountOut]);

    const exchangeRate = useMemo(() => {
        if (amountIn && amountOut) {
            return amountIn / amountOut;
        }

        return 1;
    }, [amountIn, amountOut]);

    const { swap, pending: swapPending } = useSwap({
        account,
        amountIn,
        poolId: swapPoolId,
        tokenIn,
        tokenOut,
        minAmountOut,
        isNearTransformation,
    });

    const handleSwap = () => {
        if (swap) {
            swap();
        }
    };

    const openTransaction = () => {
        openTransactionInExplorer(lastSwapTxHash);
    };

    return viewState === VIEW_STATE.inputForm ? (
        <SwapForm
            onGoBack={goHome}
            account={account}
            tokens={tokens}
        />
    ) : viewState === VIEW_STATE.preview ? (
        <SwapReviewForm
            onClickGoBack={showForm}
            activeTokenFrom={tokenIn}
            amountTokenFrom={amountIn}
            activeTokenTo={tokenOut}
            amountTokenTo={amountOut}
            accountId={account.accountId}
            handleSwapToken={handleSwap}
            exchangeRate={exchangeRate}
            // @todo calculate tradingFee
            tradingFee={0}
            swappingToken={swapPending}
            setSlippage={setSlippage}
            showSlippageOption
        />
    ) : viewState === VIEW_STATE.result ? (
        <Success
            // @todo It's not amount fields. In the old swap component
            // we pass token symbols as well as here. We have to rename it.
            amountFrom={`${amountIn} ${tokenIn?.onChainFTMetadata?.symbol}`}
            amountTo={`${amountOut} ${tokenOut?.onChainFTMetadata?.symbol}`}
            onClickContinue={showForm}
            transactionHash={lastSwapTxHash}
            onClickGoToExplorer={openTransaction}
        />
    ) : null;
});
