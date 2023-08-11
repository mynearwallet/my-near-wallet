import React from 'react';
import { useTranslation } from 'react-i18next';

import AddConnectionModal from './AddConnectionModal';
import CONFIG from '../../config';
import { RpcProviderDetail } from '../../utils/mnw-api-js';
import { wallet } from '../../utils/wallet';

export default function ConnectionComponent() {
    const { t } = useTranslation();
    const [addConnectionModal, setAddConnectionModal] = React.useState<boolean>(false);
    const [addConnectionIndex, setAddConnectionIndex] = React.useState<number>(0);
    const [connections, _setConnections] = React.useState<RpcProviderDetail[]>(() => {
        let connections;

        try {
            connections = JSON.parse(localStorage.getItem('connections'));
        } catch {
            connections = null;
        }

        if (connections) {
            return connections;
        }

        return [
            {
                id: CONFIG.NEAR_WALLET_ENV.startsWith('mainnet')
                    ? 'near'
                    : 'near-testnet',
                label: t('connection.defaultConnection'),
                priority: 10,
            },
        ];
    });

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

            localStorage.setItem('connections', JSON.stringify(connections));

            _setConnections([...connections]);
            setAddConnectionModal(false);
            wallet.init();
        },
        [connections, addConnectionIndex]
    );

    const deleteConnection = React.useCallback(
        (index) => {
            connections.splice(index, 1);

            localStorage.setItem('connections', JSON.stringify(connections));

            _setConnections([...connections]);
            wallet.init();
        },
        [connections]
    );

    return (
        <>
            <div className='container mx-auto'>
                <div className='text-2xl font-bold text-gray-900'>{t('rpcProvider')}</div>
                {connections &&
                    connections.map((connection, index) => (
                        <div
                            key={index}
                            className='h-28 w-full mt-4 bg-sky-100 border border-sky-800 rounded-xl px-5 py-3 flex flex-row'
                        >
                            <div className='flex-1'>
                                <div className='text-sky-800 text-xl'>
                                    {connection.label}
                                </div>
                                <div className='mt-1'>
                                    {t('rpcProvider')}: {connection.id}
                                </div>
                                <div className='mt-1'>
                                    {t('priority')}: {connection.priority}
                                </div>
                            </div>
                            <div className='flex-initial w-36'>
                                <button
                                    type='button'
                                    className='w-full rounded-md bg-sky-800 text-sky-200 h-10'
                                    onClick={() => {
                                        setAddConnectionIndex(index);
                                        setAddConnectionModal(true);
                                    }}
                                >
                                    {t('edit')}
                                </button>
                                <button
                                    type='button'
                                    disabled={connections.length === 1}
                                    className='w-full rounded-md bg-red-800 text-red-200 h-10 mt-2 disabled:bg-gray-400 disabled:text-gray-800 disabled:cursor-not-allowed'
                                    onClick={() => deleteConnection(index)}
                                >
                                    {t('delete')}
                                </button>
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
                        {t('addRpcProvider')}
                    </div>
                </div>
            </div>
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
