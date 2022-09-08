import React, { useState, memo, useMemo } from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import FormButton from '../../../components/common/FormButton';
import SelectToken from '../../../components/send/components/views/SelectToken';
import SwapIcon from '../../../components/svg/WrapIcon';
import { NEAR_TOKEN_ID } from '../../../config';
import { formatTokenAmount } from '../../../utils/amounts';
import isMobile from '../../../utils/isMobile';
import usePools from '../utils/hooks/usePools';
import useSwapCallback from '../utils/hooks/useSwapCallback';
import useSwapInfo from '../utils/hooks/useSwapInfo';
import Input from './Input';
import SwapInfo from './SwapInfo';
import SwapSettings from './SwapSettings';

const mobile = isMobile();

const SwapFormWrapper = styled.div`
    font-size: 1.2rem;

    .swap-button {
        width: 100%;
    }
`;

const SwapButtonWrapper = styled.div`
    margin-bottom: 1.6rem;
    display: flex;
    justify-content: center;
`;

const swapInfoDaley = 1_000;
// @todo find a better solution
const tokenSelectState = {
    noSelect: 0,
    selectIn: 1,
    selectOut: 2,
};

const initSettings = {};

export default memo(function SwapForm({ account, tokens }) {
    const [displayTokenSelect, setDisplayTokenSelect] = useState(tokenSelectState.noSelect);

    const selectTokenIn = () => setDisplayTokenSelect(tokenSelectState.selectIn);
    const selectTokenOut = () => setDisplayTokenSelect(tokenSelectState.selectOut);
    const hideTokenSelection = () => setDisplayTokenSelect(tokenSelectState.noSelect);

    const [tokenIn, setTokenIn] = useState(tokens[0]);
    const tokenInHumanBalance = useMemo(() => {
        if (tokenIn) {
            const { balance, onChainFTMetadata } = tokenIn;

            return formatTokenAmount(balance, onChainFTMetadata.decimals);
        }

        return null;
    }, [tokenIn]);

    const [tokenOut, setTokenOut] = useState(tokens[1]);
    const pools = usePools({
        // @todo find a better place for such replacement
        token0Id: tokenIn?.contractName === 'NEAR' ? NEAR_TOKEN_ID : tokenIn?.contractName,
        token1Id: tokenOut?.contractName === 'NEAR' ? NEAR_TOKEN_ID : tokenOut?.contractName,
    });

    const [settings, setSettings] = useState(initSettings);

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

    const [amountIn, setAmountIn] = useState('');
    const swapData = useSwapInfo({
        accountId: account?.accountId || '',
        poolsByIds: pools,
        tokenIn,
        amountIn,
        tokenOut,
        delay: swapInfoDaley,
        slippage: settings.slippage,
    });
    const {
        info: { poolId, amountOut, minAmountOut },
        loading: swapInfoLoading,
    } = swapData;

    const flipInputsData = () => {
        setTokenIn(tokenOut);
        setTokenOut(tokenIn);

        if (amountOut) {
            setAmountIn(amountOut);
        }
    };

    const { callback: swapCallback, pending: swapPending } = useSwapCallback({
        accountId: account?.accountId,
        amountIn,
        poolId,
        tokenIn,
        tokenOut,
        minAmountOut,
    });

    const handleSwap = () => swapCallback();

    const cannotSwap = useMemo(() => {
        if (
            !tokenIn ||
            !tokenOut ||
            !pools ||
            !amountIn ||
            !amountOut ||
            swapInfoLoading ||
            swapPending
        ) {
            return true;
        }

        return false;
    }, [tokenIn, tokenOut, pools, amountIn, amountOut, swapInfoLoading, swapPending]);

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
                    <Input
                        value={amountIn}
                        onChange={setAmountIn}
                        onSelectToken={selectTokenIn}
                        label={<Translate id="swap.from" />}
                        tokenSymbol={tokenIn?.onChainFTMetadata?.symbol}
                        tokenIcon={tokenIn?.onChainFTMetadata?.icon}
                        maxBalance={tokenInHumanBalance}
                    />
                    <SwapButtonWrapper>
                        <FormButton onClick={flipInputsData}>
                            <SwapIcon color="#fff" />
                        </FormButton>
                    </SwapButtonWrapper>
                    <Input
                        value={amountOut}
                        loading={swapInfoLoading}
                        onSelectToken={selectTokenOut}
                        label={<Translate id="swap.to" />}
                        tokenSymbol={tokenOut?.onChainFTMetadata?.symbol}
                        tokenIcon={tokenOut?.onChainFTMetadata?.symbol}
                        disabled
                    />
                    <SwapSettings onChange={setSettings} />
                    <SwapInfo data={swapData} />
                    <FormButton
                        color="blue"
                        onClick={handleSwap}
                        className="swap-button"
                        disabled={cannotSwap}
                    >
                        {swapPending ? 'Processing ...' : <Translate id="swap.confirm" />}
                    </FormButton>
                </>
            )}
        </SwapFormWrapper>
    );
});
