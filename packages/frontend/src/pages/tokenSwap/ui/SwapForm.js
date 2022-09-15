import React, { useState, memo, useMemo, useEffect } from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import BackArrowButton from '../../../components/common/BackArrowButton';
import FormButton from '../../../components/common/FormButton';
import SelectToken from '../../../components/send/components/views/SelectToken';
import SwapIcon from '../../../components/svg/WrapIcon';
import { formatTokenAmount } from '../../../utils/amounts';
import isMobile from '../../../utils/isMobile';
import { useSwapData, VIEW_STATE } from '../model/Swap';
import useSwapInfo from '../utils/hooks/useSwapInfo';
import Input from './Input';

const mobile = isMobile();

const SwapFormWrapper = styled.div`
    font-size: 1.2rem;
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
        font-weight: 900;
        margin: auto;
    }
`;

const SwapButtonWrapper = styled.div`
    margin-bottom: 1.6rem;
    display: flex;
    justify-content: center;

    .reverse-button {
        border-radius: 3.125rem;
        width: 4.5rem;
        height: 2.5rem;
        background-color: #d6edff;
        border: 0;

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

const swapInfoDaley = 1_000;
// @todo find a better solution
const tokenSelectState = {
    noSelect: 0,
    selectIn: 1,
    selectOut: 2,
};

export default memo(function SwapForm({ onGoBack, account, tokens }) {
    const [displayTokenSelect, setDisplayTokenSelect] = useState(
        tokenSelectState.noSelect
    );

    const {
        swapState: { tokenIn, tokenOut, amountIn },
        events: {
            setViewState,
            setTokenIn,
            setTokenOut,
            setAmountIn,
            setAmountOut,
            setSwapPoolId,
            setIsNearTransformation,
        },
    } = useSwapData();

    const onClickReview = () => setViewState(VIEW_STATE.preview);

    const selectTokenIn = () =>
        setDisplayTokenSelect(tokenSelectState.selectIn);
    const selectTokenOut = () =>
        setDisplayTokenSelect(tokenSelectState.selectOut);
    const hideTokenSelection = () =>
        setDisplayTokenSelect(tokenSelectState.noSelect);

    const tokenInHumanBalance = useMemo(() => {
        if (tokenIn) {
            const { balance, onChainFTMetadata } = tokenIn;

            return formatTokenAmount(balance, onChainFTMetadata.decimals);
        }

        return null;
    }, [tokenIn]);

    useEffect(() => {
        if (!tokenIn && tokens[0]) {
            setTokenIn(tokens[0]);
        }
        if (!tokenOut && tokens[1]) {
            setTokenOut(tokens[1]);
        }
    }, [tokens]);

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

    const { poolId, amountOut, isNearTransformation, loading } = useSwapInfo({
        account,
        tokenIn,
        amountIn: Number(amountIn),
        tokenOut,
        delay: swapInfoDaley,
    });

    useEffect(() => {
        setAmountOut(amountOut);
        setSwapPoolId(poolId);
        setIsNearTransformation(isNearTransformation);
    }, [amountOut, poolId, isNearTransformation]);

    const flipInputsData = () => {
        setTokenIn(tokenOut);
        setTokenOut(tokenIn);

        if (amountOut) {
            setAmountIn(amountOut);
        }
    };

    const cannotSwap = useMemo(() => {
        if (
            !tokenIn ||
            !tokenOut ||
            (!poolId && !isNearTransformation) ||
            !amountIn ||
            !amountOut
        ) {
            return true;
        }

        return false;
    }, [
        tokenIn,
        tokenOut,
        poolId,
        amountIn,
        amountOut,
        isNearTransformation,
    ]);

    return (
        <SwapFormWrapper>
            {displayTokenSelect ? (
                <SelectToken
                    isMobile={mobile}
                    onClickGoBack={hideTokenSelection}
                    fungibleTokens={tokens}
                    onSelectToken={handleTokenSelect}
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
                        maxBalance={tokenInHumanBalance}
                        inputTestId="swapPageInputAmountField"
                        tokenSelectTestId="swapPageInputTokenSelector"
                    />
                    <SwapButtonWrapper>
                        <FormButton
                            color="reverse-button"
                            onClick={flipInputsData}
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
                        loading={loading}
                        inputTestId="swapPageOutputAmountField"
                        tokenSelectTestId="swapPageOutputTokenSelector"
                        disabled
                    />
                    <Footer>
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
