import React from 'react';

import AddConnectionModal from './AddConnectionModal';
import CONFIG from '../../config';
import { RpcProviderDetail } from '../../utils/mnw-api-js';
import { wallet } from '../../utils/wallet';

export default function ConnectionComponent() {
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
                label: 'Default Connection',
                priority: 10,
            },
        ];
    });
    const [attempt, _setAttempt] = React.useState<number>(
        parseInt(localStorage.getItem('connection-attempt') ?? '5')
    );
    const [wait, _setWait] = React.useState<number>(
        parseInt(localStorage.getItem('connection-wait') ?? '100')
    );
    const [waitExponentialBackoff, _setWaitExponentialBackoff] = React.useState<number>(
        parseFloat(localStorage.getItem('connection-wait-exponential-backoff') ?? '1.1')
    );

    const setAttempt = React.useCallback((value) => {
        localStorage.setItem('connection-attempt', value);
        _setAttempt(parseInt(value));
        wallet.init();
    }, []);

    const setWait = React.useCallback((value) => {
        localStorage.setItem('connection-wait', value);
        _setWait(parseInt(value));
        wallet.init();
    }, []);

    const setWaitExponentialBackoff = React.useCallback((value) => {
        localStorage.setItem('connection-wait-exponential-backoff', value);
        _setWaitExponentialBackoff(parseFloat(value));
        wallet.init();
    }, []);

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
                <div className='grid grid-cols-3 gap-4 mt-3'>
                    <div className='col-span-2'>
                        <div className='text-2xl font-bold text-gray-900'>
                            RPC Provider
                        </div>
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
                                            RPC Provider: {connection.id}
                                        </div>
                                        <div className='mt-1'>
                                            Priority: {connection.priority}
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
                                            Edit
                                        </button>
                                        <button
                                            type='button'
                                            disabled={connections.length === 1}
                                            className='w-full rounded-md bg-red-800 text-red-200 h-10 mt-2 disabled:bg-gray-400 disabled:text-gray-800 disabled:cursor-not-allowed'
                                            onClick={() => deleteConnection(index)}
                                        >
                                            Delete
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
                                Add Rpc Provider
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className='text-2xl font-bold text-gray-900'>Connection</div>
                        <h4 className='text-lg text-bold text-sky-950 mt-2'>
                            Max retry attempts: {attempt}
                        </h4>
                        <input
                            type='range'
                            className='p-0 appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-sky-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-600'
                            min={1}
                            max={20}
                            step={1}
                            value={attempt}
                            onChange={(e) => setAttempt(e.target.value)}
                        />
                        <h4 className='text-lg text-bold text-sky-950 mt-2'>
                            Wait time before retry: {wait}ms
                        </h4>
                        <input
                            type='range'
                            className='p-0 appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-sky-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-600'
                            min={10}
                            max={1000}
                            step={10}
                            value={wait}
                            onChange={(e) => setWait(e.target.value)}
                        />
                        <h4 className='text-lg text-bold text-sky-950 mt-2'>
                            Wait time exponential backoff:{' '}
                            {waitExponentialBackoff.toFixed(2)}
                        </h4>
                        <input
                            type='range'
                            className='p-0 appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-sky-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-600'
                            min={1}
                            max={1.5}
                            step={0.01}
                            value={waitExponentialBackoff}
                            onChange={(e) => setWaitExponentialBackoff(e.target.value)}
                        />
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
