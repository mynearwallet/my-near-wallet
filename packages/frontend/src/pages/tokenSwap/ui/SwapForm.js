import React, { useState, memo, useEffect } from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import FormButton from '../../../components/common/FormButton';
import SelectToken from '../../../components/send/components/views/SelectToken';
import SwapIcon from '../../../components/svg/WrapIcon';
import fungibleTokenExchange from '../../../services/FungibleTokenExchange';
import { decreaseByPercent } from '../../../utils/amounts';
import isMobile from '../../../utils/isMobile';
import { useReturn } from '../utils/hooks';
import Input from './Input';
import SwapSettings from './SwapSettings';

const FormWrapper = styled.div``;
const swapInfoDaley = 1_000;
// @todo find a better solution
const tokenSelectState = {
    noSelect: 0,
    selectIn: 1,
    selectOut: 2,
};

const initSettings = {};

export default memo(function SwapForm({ account, tokens, pools }) {
    const [displayTokenSelect, setDisplayTokenSelect] = useState(tokenSelectState.noSelect);

    const selectTokenIn = () => setDisplayTokenSelect(tokenSelectState.selectIn);
    const selectTokenOut = () => setDisplayTokenSelect(tokenSelectState.selectOut);
    const hideTokenSelection = () => setDisplayTokenSelect(tokenSelectState.noSelect);

    const [tokenIn, setTokenIn] = useState(tokens[0]);
    const [tokenOut, setTokenOut] = useState(tokens[1]);
    const [somePool, setSomePool] = useState(null);
    const [settings, setSettings] = useState(initSettings);

    // @todo create an external hook ( * routing / best pools)
    useEffect(() => {
        const poolKey = JSON.stringify([tokenIn?.contractName, tokenOut?.contractName]);
        const reversePoolKey = JSON.stringify([tokenOut?.contractName, tokenIn?.contractName]);
        const pool = pools.all[poolKey] || pools.all[reversePoolKey];

        if (pool) {
            setSomePool(pool);
        }
    });

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
    const { amountOut, loading } = useReturn({
        accountId: account?.accountId || '',
        poolId: somePool?.poolId,
        tokenIn,
        amountIn,
        tokenOut,
        delay: swapInfoDaley,
    });

    const flipInputsData = () => {};

    const handleSwap = async () => {
        if (!account || !somePool) {
            return;
        }

        try {
            const { accountId } = account;
            const result = await fungibleTokenExchange.swap({
                accountId,
                amountIn,
                poolId: somePool.poolId,
                tokenIn,
                tokenOut,
                minAmountOut: amountOut,
                slippage: settings.slippage,
            });

            console.log('swap result', result);
        } catch (error) {
            console.error(error);
        }
    };


    const [minAmountOut, setMinAmountOut] = useState(null);

    useEffect(() => {
        if (typeof settings.slippage === 'number' && amountOut && tokenOut) {
            setMinAmountOut(
                decreaseByPercent(
                    amountOut,
                    settings.slippage,
                    tokenOut.onChainFTMetadata.decimals
                )
            );
        }
    }, [settings]);

    return (
        <FormWrapper>
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
                        tokenSymbol={tokenIn?.onChainFTMetadata?.symbol}
                        tokenIcon={tokenIn?.onChainFTMetadata?.icon}
                    />
                    <FormButton color="small-rounded" onClick={flipInputsData}>
                        <SwapIcon />
                    </FormButton>
                    <Input
                        value={amountOut}
                        loading={loading}
                        onSelectToken={selectTokenOut}
                        tokenSymbol={tokenOut?.onChainFTMetadata?.symbol}
                        tokenIcon={tokenOut?.onChainFTMetadata?.symbol}
                        disabled
                    />
                    <SwapSettings onChange={setSettings} />

                    <p>
                        Info:
                        <br />
                        <span>Min received: {minAmountOut || '-'}</span>
                    </p>

                    <FormButton
                        color="blue width width100"
                        onClick={handleSwap}
                        // disabled={}
                    >
                        <Translate id="swap.confirm" />
                    </FormButton>
                </>
            )}
        </FormWrapper>
    );
});
