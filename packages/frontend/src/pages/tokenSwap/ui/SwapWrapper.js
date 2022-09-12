import React from 'react';

import Success from '../../../components/swap/components/Success';
import { SwapReviewForm } from '../../../components/swap/components/SwapReviewForm';
import { useSwapData, VIEW_STATE } from '../model/Swap';
import SwapForm from './SwapForm';

export default function SwapWrapper({ history, account, userTokens }) {
    const {
        swapState,
        events: { setViewState },
    } = useSwapData();

    const goHome = () => history.push('/');
    const showForm = () => setViewState(VIEW_STATE.inputForm);

    return swapState.viewState === VIEW_STATE.inputForm ? (
        <SwapForm onGoBack={goHome} account={account} userTokens={userTokens} />
    ) : swapState.viewState === VIEW_STATE.preview ? (
        <SwapReviewForm
            onClickGoBack={showForm}
            // amountTokenFrom={}
            // amountTokenTo={}
            // activeTokenFrom={}
            // activeTokenTo={}
            // accountId={}
            // handleSwapToken={}
            // swappingToken={}
            // setSlippage={}
            // exchangeRate={}
            // tradingFee={}
        />
    ) : swapState.viewState === VIEW_STATE.result ? (
        <Success
            // amountFrom={}
            // amountTo={}
            // transactionHash={}
            // onClickGoToExplorer={}
            onClickContinue={showForm}
        />
    ) : null;
}
