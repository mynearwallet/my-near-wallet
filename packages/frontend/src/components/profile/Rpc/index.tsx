import React from 'react';
import { Translate } from 'react-localize-redux';

import { wallet } from '../../../utils/wallet';
import Card from '../../common/styled/Card.css';
import { Header, HeaderTitle, HeaderButton, BodyText } from './ui';

export function RpcSelector() {
    const [rpcProvider, _setRpcProvider] = React.useState(
        wallet.connection.provider.connection.url
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const setRpcProvider: (string) => void = React.useCallback(
        (input: string): void => {
            const url: string = input.replace(/\/+$/, ''); // remove trailing slash
            localStorage.setItem('defaultRpc', url);
            wallet.init();
            _setRpcProvider(url);
        },
        [_setRpcProvider]
    );

    return (
        <Card>
            <Header>
                <HeaderTitle>
                    <Translate id='rpcProvider.title' />
                </HeaderTitle>
                <HeaderButton color='blue'>
                    <Translate id='button.change' />
                </HeaderButton>
            </Header>
            <BodyText>{rpcProvider}</BodyText>
        </Card>
    );
}
