import React, { memo } from 'react';

import { Mixpanel } from '../../../mixpanel';
import { cutDecimalsIfNeeded } from '../../../utils/amounts';
import { openTransactionInExplorer } from '../../../utils/window';
import { useSwapData, VIEW_STATE } from '../model/Swap';
import { getMinAmountOut } from '../utils/calculations';
import { DECIMALS_TO_SAFE } from '../utils/constants';
import useSwap from '../utils/hooks/useSwap';
import Preview from './Preview';
import Success from './Success';
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
            slippage,
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

    const minAmountOut = getMinAmountOut({
        tokenOut,
        amountOut,
        slippage,
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

    return viewState === VIEW_STATE.inputForm ? (
        <SwapForm
            onGoBack={goHome}
            account={account}
            tokensConfig={tokensConfig}
        />
    ) : viewState === VIEW_STATE.preview ? (
        <Preview
            onClickGoBack={showForm}
            activeTokenFrom={tokenIn}
            amountTokenFrom={amountInToShow}
            activeTokenTo={tokenOut}
            amountTokenTo={amountOutToShow}
            accountId={account.accountId}
            startSwap={handleSwap}
            swappingToken={swapPending}
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
