import React from 'react';
import styled from 'styled-components';

import SwapForm from './ui/SwapForm';

const SwapWrapper = styled.div`
    max-width: 30rem;
    margin: 0 auto;
    // @todo we use below styles in other places. Move it somewhere 
    border: 2px solid #f0f0f0;
    border-radius: 8px;
`;

export default function TokenSwap() {
    // @note Swap page dependencies:
    // tokens (external. Optional: can be omitted?)
    // account instance (external)
    // pools (internal)

    return (
        <SwapWrapper>
            <SwapForm />
        </SwapWrapper>
    );
}
