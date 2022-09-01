import React from 'react';
import styled from 'styled-components';

import Input from './Input';
import SwapDetails from './SwapDetails';
import SwapSettings from './SwapSettings';

const FormWrapper = styled.div``;

export default function SwapForm() {
    const handleSwap = () => {
        console.log('start swap');
        // 
    };

    return (
        <FormWrapper>
            <Input />
            <Input />
            <SwapSettings />
            <SwapDetails />
            <button onClick={handleSwap}>Swap</button>
        </FormWrapper>
    );
}
