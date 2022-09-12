import React, { useState, memo, useMemo, useEffect, useContext } from 'react';
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
import useTokens from '../utils/hooks/useTokens';
import Input from './Input';

const mobile = isMobile();

const SwapFormWrapper = styled.div`
    font-size: 1.2rem;
`;

const Header = styled.div`
    margin-bottom: 34px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);

    .title {
        font-family: 'Inter';
        font-style: normal;
        font-size: 20px;
        line-height: 24px;
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
        border-radius: 50px;
        width: 72px;
        height: 40px;
        background-color: #d6edff;
        border: 0;

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
    margin-top: 28px;
`;

const swapInfoDaley = 1_000;
// @todo find a better solution
const tokenSelectState = {
    noSelect: 0,
    selectIn: 1,
    selectOut: 2,
};

export default memo(function SwapForm({ onGoBack, account, userTokens }) {
    const [displayTokenSelect, setDisplayTokenSelect] = useState(
        tokenSelectState.noSelect
    );

    const swapTokens = useTokens();
    const {
        swapState: {
            tokenIn,
            tokenOut,
            amountIn,
        },
        events: {
            setViewState,
            setTokenIn,
            setTokenOut,
            setAmountIn,
            setAmountOut,
            setSwapPool,
            setMinAmountOut,
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
        if (!tokenIn && userTokens[0]) {
            setTokenIn(userTokens[0]);
        }
        if (!tokenOut && userTokens[1]) {
            setTokenOut(userTokens[1]);
        }
    }, [userTokens]);

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

    const swapData = useSwapInfo({
        account,
        tokenIn,
        amountIn,
        tokenOut,
        delay: swapInfoDaley,
        slippage: 0,
    });
    const {
        info: { isNearTransformation, poolId, amountOut, minAmountOut },
        loading: swapInfoLoading,
    } = swapData;

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
            !amountOut ||
            swapInfoLoading
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
        swapInfoLoading,
        isNearTransformation,
    ]);

    return (
        <SwapFormWrapper>
            {displayTokenSelect ? (
                <SelectToken
                    isMobile={mobile}
                    onClickGoBack={hideTokenSelection}
                    fungibleTokens={swapTokens}
                    onSelectToken={handleTokenSelect}
                />
            ) : (
                <>
                    <Header>
                        <BackArrowButton onClick={onGoBack} />
                        <h4 className='title'>
                            <Translate id='swap.title' />
                        </h4>
                    </Header>
                    <Input
                        value={amountIn}
                        onChange={setAmountIn}
                        onSelectToken={selectTokenIn}
                        label={<Translate id='swap.from' />}
                        tokenSymbol={tokenIn?.onChainFTMetadata?.symbol}
                        tokenIcon={tokenIn?.onChainFTMetadata?.icon}
                        maxBalance={tokenInHumanBalance}
                        inputTestId='swapPageInputAmountField'
                        tokenSelectTestId='swapPageInputTokenSelector'
                    />
                    <SwapButtonWrapper>
                        <FormButton
                            color='reverse-button'
                            onClick={flipInputsData}
                        >
                            <SwapIcon color='#006ADC' />
                        </FormButton>
                    </SwapButtonWrapper>
                    <Input
                        value={amountOut}
                        loading={swapInfoLoading}
                        onSelectToken={selectTokenOut}
                        label={<Translate id='swap.to' />}
                        tokenSymbol={tokenOut?.onChainFTMetadata?.symbol}
                        tokenIcon={tokenOut?.onChainFTMetadata?.symbol}
                        inputTestId='swapPageOutputAmountField'
                        tokenSelectTestId='swapPageOutputTokenSelector'
                        disabled
                    />
                    <Footer>
                        <FormButton
                            disabled={cannotSwap}
                            onClick={onClickReview}
                            data-test-id='swapPageSwapPreviewStateButton'
                        >
                            <Translate id="swap.review" />
                        </FormButton>
                        <FormButton color="gray link" onClick={onGoBack}>
                            <Translate id="button.cancel" />
                        </FormButton>
                    </Footer>
                </>
            )}
        </SwapFormWrapper>
    );
});
