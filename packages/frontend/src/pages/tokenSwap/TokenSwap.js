import React, { memo, useEffect, useState } from 'react';

import Container from '../../components/common/styled/Container.css';
import { useFungibleTokensIncludingNEAR } from '../../hooks/fungibleTokensIncludingNEAR';
import { wallet } from '../../utils/wallet';
import { SwapProvider } from './model/Swap';
import SwapWrapper from './ui/SwapWrapper';

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
            <Container className="small-centered">
                <SwapWrapper
                    history={history}
                    account={account}
                    userTokens={userTokens}
                />
            </Container>
        </SwapProvider>
    );
});
