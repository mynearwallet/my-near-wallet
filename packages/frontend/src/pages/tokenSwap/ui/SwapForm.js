import React, { useState } from 'react';
import styled from 'styled-components';

import { useReturn } from '../utils/hooks';
import Input from './Input';
import SwapDetails from './SwapDetails';
import SwapSettings from './SwapSettings';
import Switch from './Switch';

const FormWrapper = styled.div``;
const swapInfoDaley = 1_000;

export default function SwapForm({ account }) {
    const [amountIn, setAmountIn] = useState('');
    const { amountOut, loading } = useReturn({
        accountId: account?.accountId || '',
        poolId: 696,
        tokenInId: 'wrap.testnet',
        amountIn: amountIn,
        tokenOut: 'dai.fakes.testnet',
        delay: swapInfoDaley,
    });

    const handleInputChange = (value) => setAmountIn(value);

    const flipInputsData = () => {};

    const handleSwap = async () => {
    };

    return (
        <FormWrapper>
            <Input value={amountIn} onChange={handleInputChange} />
            <Switch onClick={flipInputsData}  />
            <Input value={amountOut} disabled />

            {loading && 'Loading ...'}

            <SwapSettings />
            <SwapDetails />
            <button onClick={handleSwap}>Swap</button>
        </FormWrapper>
    );
}
