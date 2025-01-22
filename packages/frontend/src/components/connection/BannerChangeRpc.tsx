import React, { useState } from 'react';
import styled from 'styled-components';
import { RpcProviderDetail } from '../../utils/mnw-api-js';
import { ConnectionsStorage } from '../../utils/storage';
import { wallet } from '../../utils/wallet';
import { useTranslation } from 'react-i18next';
import closeIcon from '../../images/icon-close-gray.svg';

const StyledBanner = styled.div`
    position: relative;
    background-color: #fafafa;
    display: flex;
    justify-content: center;
    align-items: center;
    .banner-change-rpc {
        max-width: 920px;
        margin: 0 auto;
        text-align: center;
        padding: 10px 30px;
        margin: -5px 0 0 0;
    }
    .clickable {
        cursor: pointer;
        text-decoration: underline;
    }
    .close-button {
        border-radius: 20px;
        cursor: pointer;
        margin-left: 1em;
        padding: 0.6em;
        @media (max-width: 600px) {
            margin-right: 1em;
            position: absolute;
            right: 0;
            top: 1.8em;
        }
        img {
            min-width: 14px;
        }
    }
`;

const connectionStorage = ConnectionsStorage.from(localStorage);

const BannerChangeRpc = () => {
    const { t } = useTranslation();

    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [connections, setConnections] = useState<RpcProviderDetail[]>(
        connectionStorage.load() || []
    );
    const [isHidden, setHide] = useState(
        localStorage.getItem('bannerHideChangeRpc') || false
    );
    const meteorRpcIndex = connections.findIndex((c) => c.id === 'meteorRpc');

    const handleChangeRpc = () => {
        const mutatedConnections = [...connections];
        if (meteorRpcIndex !== -1) {
            mutatedConnections[meteorRpcIndex] = {
                ...mutatedConnections[meteorRpcIndex],
                priority: 0,
            };
            const newConnections = mutatedConnections
                .sort((a, b) => a.priority - b.priority)
                .map((c, i) => {
                    return {
                        ...c,
                        priority: i + 1,
                    };
                });
            connectionStorage.save(newConnections);
            setConnections([...connections]);
            setIsDirty(true);
            wallet.init();
        }
    };
    if (!meteorRpcIndex || connections[0]?.id !== 'near') {
        return null;
    }
    if (isDirty) {
        return (
            <div
                className='bg-rose-100 text-rose-600 text-md cursor-pointer p-4 rounded-md text-center'
                onClick={() => location.reload()}
            >
                {t('connection.dirty')}
            </div>
        );
    }
    if (isHidden) {
        return null;
    }
    return (
        <StyledBanner>
            <div className='banner-change-rpc'>
                You are not using the recommended RPC provider and could rate limited,
                some features might not work as intended,{' '}
                <span className='clickable' onClick={handleChangeRpc}>
                    click here
                </span>{' '}
                to switch provider.{' '}
            </div>
            <div>
                <div className='close-button'>
                    <img
                        width={'14px'}
                        src={closeIcon}
                        alt='close'
                        onClick={() => {
                            setHide(true);
                            localStorage.setItem('bannerHideChangeRpc', 'true');
                        }}
                    />
                </div>
            </div>
        </StyledBanner>
    );
};

export default BannerChangeRpc;
