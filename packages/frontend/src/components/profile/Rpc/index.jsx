import React from 'react';
import { Translate } from 'react-localize-redux';

import CONFIG from '../../../config';
import { wallet } from '../../../utils/wallet';
import Card from '../../common/styled/Card.css';
import ChangeRpcModal from './ChangeRpcModal';
import { Header, HeaderTitle, HeaderButton, BodyText } from './ui';

export function RpcSelector() {
    const [rpcProvider, _setRpcProvider] = React.useState(
        localStorage.getItem('defaultRpc') ?? CONFIG.NODE_URL
    );
    const [isChangeRpcModalOpen, setIsChangeRpcModalOpen] = React.useState(false);

    const setRpcProvider = React.useCallback(
        (input) => {
            const url = input.replace(/\/+$/, ''); // remove trailing slash
            localStorage.setItem('defaultRpc', url);
            wallet.init();
            _setRpcProvider(url);
        },
        [_setRpcProvider]
    );

    return (
        <>
            {isChangeRpcModalOpen && (
                <ChangeRpcModal
                    onClose={() => setIsChangeRpcModalOpen(false)}
                    rpcProvider={rpcProvider}
                    setRpcProvider={setRpcProvider}
                />
            )}
            <Card>
                <Header>
                    <HeaderTitle>
                        <Translate id='rpcProvider.title' />
                    </HeaderTitle>
                    <HeaderButton
                        color='blue'
                        onClick={() => setIsChangeRpcModalOpen(true)}
                    >
                        <Translate id='button.change' />
                    </HeaderButton>
                </Header>
                <BodyText>{rpcProvider}</BodyText>
            </Card>
        </>
    );
}
