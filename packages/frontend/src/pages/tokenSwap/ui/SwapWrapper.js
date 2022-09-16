import React, { memo, useState } from 'react';

import Success from '../../../components/swap/components/Success';
import { SwapReviewForm } from '../../../components/swap/components/SwapReviewForm';
import { cutDecimalsIfNeeded } from '../../../utils/amounts';
import { openTransactionInExplorer } from '../../../utils/window';
import { useSwapData, VIEW_STATE } from '../model/Swap';
import { DECIMALS_TO_SAFE } from '../utils/constants';
import useCalculatedValues from '../utils/hooks/useCalculatedValues';
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
            swapFee,
            isNearTransformation,
            lastSwapTxHash,
        },
        events: { setViewState, setAmountIn },
    } = useSwapData();

    const goHome = () => history.push('/');
    const showForm = () => setViewState(VIEW_STATE.inputForm);
    const updateForm = () => {
        setAmountIn('');
        setViewState(VIEW_STATE.inputForm);
    };

    const [slippage, setSlippage] = useState(0);
    const { minAmountOut, exchangeRate, tradingFee } = useCalculatedValues({
        amountIn,
        tokenOut,
        amountOut,
        slippage,
        swapFee,
    });

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

    const amountInToShow = cutDecimalsIfNeeded(amountIn, DECIMALS_TO_SAFE);
    const amountOutToShow = cutDecimalsIfNeeded(amountOut, DECIMALS_TO_SAFE);

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
            amountTokenFrom={amountInToShow}
            activeTokenTo={tokenOut}
            amountTokenTo={amountOutToShow}
            accountId={account.accountId}
            handleSwapToken={handleSwap}
            exchangeRate={exchangeRate}
            tradingFee={tradingFee}
            swappingToken={swapPending}
            setSlippage={setSlippage}
            feeTakenFromInput
            showSlippageOption
        />
    ) : viewState === VIEW_STATE.result ? (
        <Success
            // @todo It's not amount fields. We have to rename it.
            amountFrom={`${amountInToShow} ${tokenIn?.onChainFTMetadata?.symbol}`}
            amountTo={`${amountOutToShow} ${tokenOut?.onChainFTMetadata?.symbol}`}
            onClickContinue={updateForm}
            transactionHash={lastSwapTxHash}
            onClickGoToExplorer={openTransaction}
        />
    ) : null;
});
