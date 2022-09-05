import React, { memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { useFungibleTokensIncludingNEAR } from '../../hooks/fungibleTokensIncludingNEAR';
import { selectPoolsSlice } from '../../redux/slices/swap';
import { wallet } from '../../utils/wallet';
import SwapForm from './ui/SwapForm';

const SwapWrapper = styled.div`
    max-width: 30rem;
    margin: 0 auto;
    // @todo we use below styles in other places. Move it somewhere 
    border: 2px solid #f0f0f0;
    border-radius: 8px;
`;

function TokenSwap({ accountId, pools }) {
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
            <SwapForm account={account} tokens={tokens} pools={pools} />
        </SwapWrapper>
    );
};

const mapStateToProps = (state) => ({
    ...selectPoolsSlice(state)
});

export default connect(mapStateToProps)(memo(TokenSwap));
