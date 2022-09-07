import React, { useState, memo, useMemo } from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import FormButton from '../../../components/common/FormButton';
import SelectToken from '../../../components/send/components/views/SelectToken';
import SwapIcon from '../../../components/svg/WrapIcon';
import fungibleTokenExchange from '../../../services/tokenExchange';
import { formatTokenAmount } from '../../../utils/amounts';
import isMobile from '../../../utils/isMobile';
import usePools from '../utils/hooks/usePools';
import useSwapInfo from '../utils/hooks/useSwapInfo';
import Input from './Input';
import SwapInfo from './SwapInfo';
import SwapSettings from './SwapSettings';

const SwapButtonWrapper = styled.div`
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
        token0Id: tokenIn?.contractName === 'NEAR' ? 'wrap.testnet' : tokenIn?.contractName,
        token1Id: tokenOut?.contractName === 'NEAR' ? 'wrap.testnet' : tokenOut?.contractName,
    });

    const [settings, setSettings] = useState(initSettings);

    const handleTokenSelect = (token) => {
        switch (displayTokenSelect) {
            case tokenSelectState.selectIn:
                setTokenIn(token);
                break;
            case tokenSelectState.selectOut:
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
        info: { amountOut, minAmountOut },
        loading: swapInfoLoading,
    } = swapData;

    const flipInputsData = () => {
        setTokenIn(tokenOut);
        setTokenOut(tokenIn);

        if (amountOut) {
            setAmountIn(amountOut);
        }
    };

    const handleSwap = async () => {
        if (!account || !pools) {
            return;
        }

        try {
            const { accountId } = account;
            const result = await fungibleTokenExchange.swap({
                accountId,
                amountIn,
                poolId: pools && Number(Object.keys(pools)[0]),
                tokenIn,
                tokenOut,
                minAmountOut,
            });

            console.log('swap result', result);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            {displayTokenSelect ? (
                <SelectToken
                    isMobile={isMobile()}
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
                        color="blue width width100"
                        onClick={handleSwap}
                        // disabled={}
                    >
                        <Translate id="swap.confirm" />
                    </FormButton>
                </>
            )}
        </>
    );
});
