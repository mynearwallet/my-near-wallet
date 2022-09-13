import React, { useEffect, useState, useMemo } from 'react';

import Container from '../../components/common/styled/Container.css';
import { useFungibleTokensIncludingNEAR } from '../../hooks/fungibleTokensIncludingNEAR';
import { wallet } from '../../utils/wallet';
import { SwapProvider } from './model/Swap';
import SwapWrapper from './ui/SwapWrapper';
import useTokens from './utils/hooks/useTokens';

export default function TokenSwap({ history, accountId }) {
    const [account, setAccount] = useState(null);
    const userTokens = useFungibleTokensIncludingNEAR({
        includeNearContractName: true,
    });
    const swapTokens = useTokens();
    // userTokens[0] = NEAR config
    // @todo Find a better solution. 
    // Set all tokens in the redux state, including NEAR "token"
    const availableTokens = useMemo(() => {
        return [userTokens[0], ...swapTokens];
    }, [userTokens, swapTokens]);

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
            <Container className="small-centered">
                <SwapWrapper
                    history={history}
                    account={account}
                    tokens={availableTokens}
                />
            </Container>
        </SwapProvider>
    );
};
