import React, { memo, useState, useEffect } from 'react';

import { Mixpanel } from '../../../mixpanel';
import { cutDecimalsIfNeeded } from '../../../utils/amounts';
import { openTransactionInExplorer } from '../../../utils/window';
import { useSwapData, VIEW_STATE } from '../model/Swap';
import ReviewForm from '../ui/ReviewForm';
import Success from '../ui/Success';
import { getCalculatedSwapValues, getSwapCost } from '../utils/calculations';
import { DECIMALS_TO_SAFE } from '../utils/constants';
import useSwap from '../utils/hooks/useSwap';
import PriceImpact from './PriceImpact';
import SwapForm from './SwapForm';

export default memo(function SwapWrapper({ history, account, tokensConfig }) {
    const {
        swapState: {
            viewState,
            tokenIn,
            amountIn,
            tokenOut,
            amountOut,
            swapPoolId,
            swapFee,
            priceImpactPercent,
            isNearTransformation,
            lastSwapTxHash,
            swapPending,
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
    const { minAmountOut, swapFeeAmount } = getCalculatedSwapValues({
        amountIn,
        tokenOut,
        amountOut,
        slippage,
        swapFee,
    });

    const swap = useSwap({
        account,
        amountIn,
        poolId: swapPoolId,
        tokenIn,
        tokenOut,
        minAmountOut,
        isNearTransformation,
    });

    const [estimatedFee, setEstimatedFee] = useState('');

    useEffect(() => {
        const fetch = async () => {
            const fee = await getSwapCost(tokenIn, tokenOut);

            setEstimatedFee(fee);
        };

        fetch();
    }, []);

    const handleSwap = () => {
        if (swap) {
            Mixpanel.track('Click Confirm & Swap on Swap page');
            swap();
        }
    };

    const openTransaction = () => {
        openTransactionInExplorer(lastSwapTxHash);
    };

    const amountInToShow = cutDecimalsIfNeeded(amountIn, DECIMALS_TO_SAFE);
    const amountOutToShow = cutDecimalsIfNeeded(amountOut, DECIMALS_TO_SAFE);
    const minAmountOutToShow = cutDecimalsIfNeeded(
        minAmountOut,
        DECIMALS_TO_SAFE
    );

    return viewState === VIEW_STATE.inputForm ? (
        <SwapForm
            onGoBack={goHome}
            account={account}
            tokensConfig={tokensConfig}
        />
    ) : viewState === VIEW_STATE.preview ? (
        <ReviewForm
            onClickGoBack={showForm}
            activeTokenFrom={tokenIn}
            amountTokenFrom={amountInToShow}
            activeTokenTo={tokenOut}
            amountTokenTo={amountOutToShow}
            minReceivedAmount={minAmountOutToShow}
            accountId={account.accountId}
            startSwap={handleSwap}
            swapFee={swapFee}
            swapFeeAmount={swapFeeAmount}
            swappingToken={swapPending}
            setSlippage={setSlippage}
            showAllInfo={!isNearTransformation}
            priceImpactElement={<PriceImpact percent={priceImpactPercent} />}
            estimatedFee={estimatedFee}
        />
    ) : viewState === VIEW_STATE.result ? (
        <Success
            tokenIn={tokenIn}
            amountIn={amountInToShow}
            tokenOut={tokenOut}
            amountOut={amountOutToShow}
            onClickContinue={updateForm}
            transactionHash={lastSwapTxHash}
            onClickGoToExplorer={openTransaction}
        />
    ) : null;
});
