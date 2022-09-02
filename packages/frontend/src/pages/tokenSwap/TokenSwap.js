import React, { memo, useEffect, useState } from 'react';
import styled from 'styled-components';

import { wallet } from '../../utils/wallet';
import SwapForm from './ui/SwapForm';

const SwapWrapper = styled.div`
    max-width: 30rem;
    margin: 0 auto;
    // @todo we use below styles in other places. Move it somewhere 
    border: 2px solid #f0f0f0;
    border-radius: 8px;
`;

export default memo(function TokenSwap({ accountId }) {
    const [account, setAccount] = useState(null);

    useEffect(() => {
        if (accountId) {
            const updateAccount = async () => {
                const instance = await wallet.getAccount(accountId, true);

                setAccount(instance);
            };

            updateAccount();
        }
    }, [accountId]);

    return (
        <SwapWrapper>
            <SwapForm account={account} />
        </SwapWrapper>
    );
});
