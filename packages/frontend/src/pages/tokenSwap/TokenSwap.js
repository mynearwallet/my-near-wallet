import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

import Container from '../../components/common/styled/Container.css';
import selectNEARAsTokenWithMetadata from '../../redux/selectors/crossStateSelectors/selectNEARAsTokenWithMetadata';
import { selectAllTokens } from '../../redux/slices/swap';
import { wallet } from '../../utils/wallet';
import { SwapProvider } from './model/Swap';
import SwapWrapper from './ui/SwapWrapper';

export default function TokenSwap({ history, accountId }) {
    const [account, setAccount] = useState(null);
    const NEARConfig = useSelector((state) =>
        selectNEARAsTokenWithMetadata(state, { includeNearContractName: true })
    );
    const tokens = useSelector(selectAllTokens);

    const availableTokens = useMemo(() => {
        return { [NEARConfig.contractName]: NEARConfig, ...tokens };
    }, [NEARConfig, tokens]);

    useEffect(() => {
        let mounted = true;

        if (accountId) {
            const updateAccount = async () => {
                const instance = await wallet.getAccount(accountId, true);

                if (mounted) {
                    setAccount(instance);
                }
            };

            updateAccount();
        }

        return () => {
            mounted = false;
        };
    }, [accountId]);

    return (
        <Container className="small-centered">
            <SwapProvider>
                <SwapWrapper
                    history={history}
                    account={account}
                    tokens={availableTokens}
                />
            </SwapProvider>
        </Container>
    );
};
