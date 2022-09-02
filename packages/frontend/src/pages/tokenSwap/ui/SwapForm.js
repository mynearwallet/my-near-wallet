import React, { useState } from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import FormButton from '../../../components/common/FormButton';
import SelectToken from '../../../components/send/components/views/SelectToken';
import SwapIcon from '../../../components/svg/WrapIcon';
import fungibleTokenExchange from '../../../services/FungibleTokenExchange';
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

export default function SwapForm({ account, tokens }) {
    const [displayTokenSelect, setDisplayTokenSelect] = useState(tokenSelectState.noSelect);

    const selectTokenIn = () => setDisplayTokenSelect(tokenSelectState.selectIn);
    const selectTokenOut = () => setDisplayTokenSelect(tokenSelectState.selectOut);
    const hideTokenSelection = () => setDisplayTokenSelect(tokenSelectState.noSelect);

    const [tokenIn, setTokenIn] = useState(tokens[0]);
    const [tokenOut, setTokenOut] = useState(tokens[1]);

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
    // @todo use real data
    const config = {
        poolId: 696,
    };

    const { amountOut } = useReturn({
        accountId: account?.accountId || '',
        poolId: config.poolId,
        tokenInId: tokenIn?.contractName,
        amountIn,
        tokenOutId: tokenOut?.contractName,
        delay: swapInfoDaley,
    });

    const flipInputsData = () => {};

    const handleSwap = async () => {
        if (!account) {
            return;
        }

        try {
            const { accountId } = account;
            const result = await fungibleTokenExchange.swap({
                accountId,
                amountIn,
                poolId: config.poolId,
                tokenInId: tokenIn.contractName,
                tokenOutId: tokenOut.contractName,
                minAmountOut: amountOut,
            });

            console.log('swap result', result);
        } catch (error) {
            console.error(error);
        }
    };

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
                        onSelectToken={selectTokenOut}
                        tokenSymbol={tokenOut?.onChainFTMetadata?.symbol}
                        tokenIcon={tokenOut?.onChainFTMetadata?.symbol}
                        disabled
                    />
                    <SwapSettings />
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
}
