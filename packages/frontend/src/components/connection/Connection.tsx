import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import AddConnectionModal from './AddConnectionModal';
import CONFIG from '../../config';
import { RpcProviderDetail } from '../../utils/mnw-api-js';
import { ConnectionsStorage, defaultConnections } from '../../utils/storage';
import { wallet } from '../../utils/wallet';

const connectionStorage = ConnectionsStorage.from(localStorage);

export default function ConnectionComponent() {
    const { t } = useTranslation();
    const [isDirty, setIsDirty] = React.useState<boolean>(false);
    const [addConnectionModal, setAddConnectionModal] = React.useState<boolean>(false);
    const [addConnectionIndex, setAddConnectionIndex] = React.useState<number>(0);
    const [connections, _setConnections] = React.useState<RpcProviderDetail[]>(
        connectionStorage.load()
    );

    const selectConnection = (index) => {
        const mutatedConnections = [...connections];
        mutatedConnections[index] = {
            ...mutatedConnections[index],
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

        _setConnections([...connections]);
        setIsDirty(true);
        wallet.init();
    };

    const saveConnection = React.useCallback(
        (newConnection: RpcProviderDetail) => {
            if (addConnectionIndex < connections.length) {
                connections[addConnectionIndex] = newConnection;
            } else {
                connections.push(newConnection);
            }

            connections.sort(
                (connectionA, connectionB) => connectionA.priority - connectionB.priority
            );

            connectionStorage.save(connections);

            _setConnections([...connections]);
            setAddConnectionModal(false);
            setIsDirty(true);
            wallet.init();
        },
        [connections, addConnectionIndex]
    );

    const deleteConnection = React.useCallback(
        (index) => {
            connections.splice(index, 1);

            connectionStorage.save(connections);

            _setConnections([...connections]);
            setIsDirty(true);
            wallet.init();
        },
        [connections]
    );

    return (
        <>
            <Container className='container mx-auto max-w-3xl px-3 py-2'>
                <div className='text-2xl font-bold text-gray-900'>
                    {t('connection.rpcProvider')}
                </div>
                {isDirty && (
                    <div
                        className='bg-rose-100 text-rose-600 text-md cursor-pointer p-4 mt-2 rounded-md'
                        onClick={() => location.reload()}
                    >
                        {t('connection.dirty')}
                    </div>
                )}
                {connections &&
                    connections.map((connection, index) => (
                        <div
                            key={index}
                            className='content-box min-h-28 w-full mt-4 bg-sky-100 border border-sky-800 rounded-xl px-5 py-3 flex flex-row'
                        >
                            <div>
                                <div className='text-sky-800 text-xl'>
                                    {connection.label}
                                </div>
                                <div className='mt-1'>
                                    {t('connection.rpcProvider')}: {connection.id}
                                </div>
                                {connection.data?.url && (
                                    <div className='mt-1'>
                                        {t('connection.url')}: {connection.data?.url}
                                    </div>
                                )}
                                <div className='mt-1'>
                                    {t('connection.priority')}: {connection.priority}
                                </div>
                            </div>
                            <div className='button-container'>
                                <button
                                    type='button'
                                    className='rounded-md bg-blue-600 text-blue-200 disabled:bg-gray-400 disabled:text-gray-800 disabled:cursor-not-allowed'
                                    onClick={() => selectConnection(index)}
                                >
                                    {t('connection.select')}
                                </button>
                                {!defaultConnections.find(
                                    (c) => c.id === connection.id
                                ) && (
                                    <>
                                        <button
                                            type='button'
                                            className='rounded-md bg-sky-600 text-sky-200'
                                            onClick={() => {
                                                setAddConnectionIndex(index);
                                                setAddConnectionModal(true);
                                            }}
                                        >
                                            {t('connection.edit')}
                                        </button>
                                        <button
                                            type='button'
                                            disabled={connections.length === 1}
                                            className='rounded-md bg-red-600 text-red-200 disabled:bg-gray-400 disabled:text-gray-800 disabled:cursor-not-allowed'
                                            onClick={() => deleteConnection(index)}
                                        >
                                            {t('connection.delete')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                <div
                    className='h-28 w-full mt-4 bg-gray-100 hover:bg-sky-100 flex items-center  
                        rounded-xl border-2 border-dashed border-sky-800 cursor-pointer'
                    onClick={() => {
                        setAddConnectionIndex(connections.length);
                        setAddConnectionModal(true);
                    }}
                >
                    <div className='w-full text-center text-sky-800 text-xl'>
                        {t('connection.addRpcProvider')}
                    </div>
                </div>
            </Container>
            <AddConnectionModal
                open={addConnectionModal}
                onClose={() => setAddConnectionModal(false)}
                saveConnection={saveConnection}
                connection={
                    addConnectionIndex < connections.length
                        ? connections[addConnectionIndex]
                        : {
                              id: CONFIG.NEAR_WALLET_ENV.startsWith('mainnet')
                                  ? 'near'
                                  : 'near-testnet',
                          }
                }
            />
        </>
    );
}

const Container = styled.div`
    .content-box {
        display: flex;
        justify-content: space-between;
        flex-direction: column;
        gap: 1.2rem;
        @media (min-width: 768px) {
            flex-direction: row;
        }
    }
    .button-container {
        display: flex;
        justify-content: flex-start;
        gap: 0.5rem;
        @media (min-width: 768px) {
            justify-content: center;
            flex-direction: column;
        }
    }
    button {
        height: 2rem;
        padding: 0 1.8rem;
    }
`;
