import React from 'react';

import Success from '../../../components/swap/components/Success';
import { SwapReviewForm } from '../../../components/swap/components/SwapReviewForm';
import { useSwapData, VIEW_STATE } from '../model/Swap';
import useSwapCallback from '../utils/hooks/useSwapCallback';
import SwapForm from './SwapForm';

export default function SwapWrapper({ history, account, userTokens }) {
    const {
        swapState: {
            viewState,
            tokenIn,
            amountIn,
            tokenOut,
            amountOut,
            swapPool,
            minAmountOut,
            isNearTransformation,
        },
        events: { setViewState },
    } = useSwapData();

    const goHome = () => history.push('/');
    const showForm = () => setViewState(VIEW_STATE.inputForm);

    const { callback: swapCallback, pending: swapPending } = useSwapCallback({
        account,
        amountIn,
        poolId: swapPool?.poolId,
        tokenIn,
        tokenOut,
        minAmountOut,
        isNearTransformation,
    });

    const handleSwap = swapCallback();

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
            // swappingToken={}
            // setSlippage={}
            // exchangeRate={}
            // tradingFee={}
        />
    ) : viewState === VIEW_STATE.result ? (
        <Success
            // amountFrom={}
            // amountTo={}
            // transactionHash={}
            // onClickGoToExplorer={}
            onClickContinue={showForm}
        />
    ) : null;
}
