import React, { memo, useEffect, useState } from 'react';
import styled from 'styled-components';

import { useFungibleTokensIncludingNEAR } from '../../hooks/fungibleTokensIncludingNEAR';
import { wallet } from '../../utils/wallet';
import { SwapProvider } from './model/Swap';
import SwapWrapper from './ui/SwapWrapper';

const TokenSwapWrapper = styled.div`
    max-width: 30rem;
    margin: 0 auto;
    padding: 0.5rem;
`;

export default memo(function TokenSwap({ history, accountId }) {
    const [account, setAccount] = useState(null);
    const userTokens = useFungibleTokensIncludingNEAR({
        includeNearContractName: true,
    });

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
        <SwapProvider>
            <TokenSwapWrapper>
                <SwapWrapper
                    history={history}
                    account={account}
                    userTokens={userTokens}
                />
            </TokenSwapWrapper>
        </SwapProvider>
    );
});
