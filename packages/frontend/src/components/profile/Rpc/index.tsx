import React from 'react';
import { Translate } from 'react-localize-redux';

import { wallet } from '../../../utils/wallet';
import Card from '../../common/styled/Card.css';
import { Header, HeaderTitle, HeaderButton, BodyText } from './ui';

function rpcProviderReducer(
    state: string,
    { type, input }: { type: string; input: string }
): string {
    switch (type) {
        case 'update': {
            const url: string = input.replace(/\/+$/, ''); // remove trailing slash
            localStorage.setItem('defaultRpc', url);
            wallet.init();
            return url;
            break;
        }
        default:
            return state;
    }
}

export function RpcSelector() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [rpcProvider, dispatchRpcProviderReducer] = React.useReducer(
        rpcProviderReducer,
        wallet.connection.provider.connection.url
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
