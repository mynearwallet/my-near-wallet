import React, { useState } from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';
import { RpcProviderDetail } from '../../utils/mnw-api-js';
import { ConnectionsStorage } from '../../utils/storage';
import { wallet } from '../../utils/wallet';
import { useTranslation } from 'react-i18next';

const StyledBanner = styled.div`
    background-color: #fafafa;
    display: flex;
    justify-content: center;
    .banner-change-rpc {
        max-width: 700px;
        margin: 0 auto;
        text-align: center;
        padding: 10px 20px;
        margin: -5px 0 0 0;
        cursor: pointer;
        &:hover {
            text-decoration: underline;
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
    return (
        <>
            {isDirty ? (
                <div
                    className='bg-rose-100 text-rose-600 text-md cursor-pointer p-4 rounded-md text-center'
                    onClick={() => location.reload()}
                >
                    {t('connection.dirty')}
                </div>
            ) : (
                <StyledBanner>
                    <div className='banner-change-rpc' onClick={handleChangeRpc}>
                        <Translate id='banner.changeMainRpcTitle' />
                    </div>
                </StyledBanner>
            )}
        </>
    );
};

export default BannerChangeRpc;
