import React, { memo, useEffect, useState } from 'react';
import { Translate } from 'react-localize-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { useFungibleTokensIncludingNEAR } from '../../hooks/fungibleTokensIncludingNEAR';
import { wallet } from '../../utils/wallet';
import SwapForm from './ui/SwapForm';

const SwapWrapper = styled.div`
    max-width: 30rem;
    margin: 0 auto;
    padding: 0.5rem;
`;

const Header = styled.div`
    margin-bottom: 3rem;
    display: grid;
    grid-template-columns: repeat(3, 1fr);

    .title {
        font-family: "Inter";
        font-style: normal;
        font-weight: 700;
        font-size: 20px;
        line-height: 24px;
        text-align: center;
        font-weight: 900;
        margin: auto;
    }
`;

export default memo(function TokenSwap({ accountId }) {
    const [account, setAccount] = useState(null);
    const tokens = useFungibleTokensIncludingNEAR({
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
        <SwapWrapper>
            <Header>
                <Link to="/">Home</Link>
                <h4 className="title">
                    <Translate id="swap.title" />
                </h4>
            </Header>

            <SwapForm account={account} tokens={tokens} />
        </SwapWrapper>
    );
});
