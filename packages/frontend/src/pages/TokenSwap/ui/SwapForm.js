import React, { useState, memo, useMemo, useEffect } from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import BackArrowButton from '../../../components/common/BackArrowButton';
import FormButton from '../../../components/common/FormButton';
import SelectToken from '../../../components/send/components/views/SelectToken';
import SwapIcon from '../../../components/svg/WrapIcon';
import isMobile from '../../../utils/isMobile';
import { useSwapData, VIEW_STATE } from '../model/Swap';
import useSwapInfo from '../utils/hooks/useSwapInfo';
import Input from './Input';
import Notification from './Notification';

const mobile = isMobile();

const SwapFormWrapper = styled.div`
    // Styles for the <SelectToken /> component.
    // We use the same styles in the old swap components.
    // @todo find a way to use it in one place.
    // Can we put it in <SelectToken /> ?
    div.header {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #272729;
        font-weight: 600;
        font-size: 20px;
        word-break: break-all;

        .back-arrow-button {
            position: absolute;
            left: 0;
        }
    }
`;

const Header = styled.div`
    margin-bottom: 2.125rem;
    display: grid;
    grid-template-columns: repeat(3, 1fr);

    .title {
        font-family: "Inter";
        font-style: normal;
        font-size: 1.25rem;
        line-height: 1.5rem;
        text-align: center;
        font-weight: 700;
        margin: auto;
    }
`;

const SwapButtonWrapper = styled.div`
    margin: 0.8rem 0;
    display: flex;
    justify-content: center;

    .reverse-button {
        width: 4.5rem;
        background-color: #E1F0FF;

        svg {
            width: initial !important;
            height: initial !important;
            margin: initial !important;
        }

        :hover {
            background-color: #0072ce;

            svg {
                path {
                    fill: #ffffff;
                }
            }
        }
    }
`;

const Footer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-top: 1.75rem;

    button {
        width: 100%;
    }

    .cancel-button-wrapper {
        margin-top: 1.75rem;
    }
`;

const swapInfoDaley = 600;
const tokenSelectState = {
    noSelect: 0,
    selectIn: 1,
    selectOut: 2,
};

export default memo(function SwapForm({ onGoBack, account, tokensConfig  }) {
    const { tokensIn, listOfTokensIn, tokensOut, listOfTokensOut } = tokensConfig;
    const {
        swapState: { tokenIn, tokenOut, amountIn },
        events: {
            setViewState,
            setTokenIn,
            setTokenOut,
            setAmountIn,
            setAmountOut,
            setSwapPoolId,
            setSwapFee,
            setIsNearTransformation,
        },
    } = useSwapData();

    useEffect(() => {
        if (!tokenIn && listOfTokensIn[0]) {
            setTokenIn(listOfTokensIn[0]);
        } else {
            const newTokenIn = tokensIn[tokenIn?.contractName] || tokensOut[tokenIn?.contractName];

            setTokenIn(newTokenIn);
        }
    }, [listOfTokensIn]);

    useEffect(() => {
        if (!tokenOut && listOfTokensOut[1]) {
            setTokenOut(listOfTokensOut[1]);
        } else {
            setTokenOut(tokensOut[tokenOut?.contractName]);
        }
    }, [listOfTokensOut]);

    const onClickReview = () => setViewState(VIEW_STATE.preview);

    const [displayTokenSelect, setDisplayTokenSelect] = useState(
        tokenSelectState.noSelect
    );
    const tokensToSelect = useMemo(() => {
        if (!displayTokenSelect) {
            return [];
        }

        return displayTokenSelect === tokenSelectState.selectIn
            ? listOfTokensIn
            : listOfTokensOut;
    }, [displayTokenSelect, listOfTokensIn, listOfTokensOut]);

    const selectTokenIn = () => setDisplayTokenSelect(tokenSelectState.selectIn);
    const selectTokenOut = () => setDisplayTokenSelect(tokenSelectState.selectOut);
    const hideTokenSelection = () => setDisplayTokenSelect(tokenSelectState.noSelect);

    const handleTokenSelect = (token) => {
        switch (displayTokenSelect) {
            case tokenSelectState.selectIn:
                if (token.contractName === tokenOut.contractName) {
                    setTokenOut(tokenIn);
                }
                setTokenIn(token);
                break;
            case tokenSelectState.selectOut:
                if (token.contractName === tokenIn.contractName) {
                    setTokenIn(tokenOut);
                }
                setTokenOut(token);
                break;
        }

        setDisplayTokenSelect(tokenSelectState.noSelect);
    };

    const {
        poolId,
        swapFee,
        amountOut,
        isNearTransformation,
        swapNotification,
        loading,
    } = useSwapInfo({
        account,
        tokenIn,
        amountIn: Number(amountIn),
        tokenOut,
        delay: swapInfoDaley,
    });

    useEffect(() => {
        setAmountOut(amountOut);
        setSwapPoolId(poolId);
        setSwapFee(swapFee);
        setIsNearTransformation(isNearTransformation);
    }, [amountOut, poolId, isNearTransformation]);

    const flipInputsData = () => {
        setTokenIn(tokenOut);
        setTokenOut(tokenIn);

        if (amountOut) {
            setAmountIn(amountOut);
        }
    };

    const [isValidInput, setIsValidInput] = useState(false);

    const cannotSwap = useMemo(() => {
        if (
            !tokenIn ||
            !tokenOut ||
            (!poolId && !isNearTransformation) ||
            !amountIn ||
            !amountOut ||
            !isValidInput
        ) {
            return true;
        }

        return false;
    }, [tokenIn, tokenOut, poolId, amountIn, amountOut, isNearTransformation, isValidInput]);

    return (
        <SwapFormWrapper>
            {displayTokenSelect ? (
                <SelectToken
                    isMobile={mobile}
                    onClickGoBack={hideTokenSelection}
                    fungibleTokens={tokensToSelect}
                    onSelectToken={handleTokenSelect}
                    balanceLabelId="swap.availableToSwap"
                />
            ) : (
                <>
                    <Header>
                        <BackArrowButton onClick={onGoBack} />
                        <h4 className="title">
                            <Translate id="swap.title" />
                        </h4>
                    </Header>
                    <Input
                        value={amountIn}
                        onChange={setAmountIn}
                        onSelectToken={selectTokenIn}
                        label={<Translate id="swap.from" />}
                        tokenSymbol={tokenIn?.onChainFTMetadata?.symbol}
                        tokenIcon={tokenIn?.onChainFTMetadata?.icon}
                        tokenDecimals={tokenIn?.onChainFTMetadata?.decimals}
                        maxBalance={tokenIn?.balance}
                        setIsValidInput={setIsValidInput}
                        inputTestId="swapPageInputAmountField"
                        tokenSelectTestId="swapPageInputTokenSelector"
                        disabled={!tokenIn}
                    />
                    <SwapButtonWrapper>
                        <FormButton
                            color="reverse-button"
                            onClick={flipInputsData}
                            swapButton
                        >
                            <SwapIcon color="#006ADC" />
                        </FormButton>
                    </SwapButtonWrapper>
                    <Input
                        value={amountOut}
                        onSelectToken={selectTokenOut}
                        label={<Translate id="swap.to" />}
                        tokenSymbol={tokenOut?.onChainFTMetadata?.symbol}
                        tokenIcon={tokenOut?.onChainFTMetadata?.icon}
                        tokenDecimals={tokenOut?.onChainFTMetadata?.decimals}
                        maxBalance={tokenOut?.balance}
                        loading={loading}
                        inputTestId="swapPageOutputAmountField"
                        tokenSelectTestId="swapPageOutputTokenSelector"
                        disabled
                    />
                    <Footer>
                        {swapNotification && (
                            <Notification
                                id={swapNotification.id}
                                type={swapNotification.type}
                                data={swapNotification.data}
                            />
                        )}
                        <FormButton
                            disabled={cannotSwap}
                            onClick={onClickReview}
                            data-test-id="swapPageSwapPreviewStateButton"
                        >
                            <Translate id="swap.review" />
                        </FormButton>
                        <div className="cancel-button-wrapper">
                            <FormButton color="link gray" onClick={onGoBack}>
                                <Translate id="button.cancel" />
                            </FormButton>
                        </div>
                    </Footer>
                </>
            )}
        </SwapFormWrapper>
    );
});
