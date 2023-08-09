import React from 'react';

import AddConnectionModal from './AddConnectionModal';
import CONFIG from '../../config';

export default function ConnectionComponent() {
    const [addConnectionModal, setAddConnectionModal] = React.useState<boolean>(false);
    const [randomVariable, setRandomVariable] = React.useState<number>(1);

    const connections = React.useMemo(() => {
        try {
            return JSON.parse(localStorage.getItems('connections'));
        } catch {
            return [
                {
                    id: CONFIG.NETWORK_ID.startsWith('mainnet') ? 'near' : 'near-testnet',
                    label: 'Default Connection',
                    priority: 10,
                },
            ];
        }
    }, [randomVariable]);

    const saveConnection = React.useCallback(() => {
        //save connection to local storage

        setRandomVariable((prev) => prev + 1);
    }, []);

    return (
        <>
            <div className='container mx-auto'>
                <div className='grid grid-cols-3 gap-4'>
                    <div className='col-span-2'>
                        <div className='text-2xl font-bold text-gray-900'>
                            RPC Provider
                        </div>
                        {connections.map((connection) => (
                            <div className='h-28 w-full mt-4 bg-sky-100 border border-sky-800 rounded-xl px-5 py-3'>
                                <div className='text-sky-800 text-xl'>
                                    {connection.label}
                                </div>
                                <div className='mt-1'>RPC Provider: {connection.id}</div>
                                <div className='mt-1'>
                                    Priority: {connection.priority}
                                </div>
                            </div>
                        ))}
                        <div
                            className='h-28 w-full mt-4 bg-gray-100 hover:bg-sky-100 flex items-center  
                        rounded-xl border-2 border-dashed border-sky-800 cursor-pointer'
                            onClick={() => setAddConnectionModal(true)}
                        >
                            <div className='w-full text-center text-sky-800 text-xl'>
                                Add Rpc Provider
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className='text-2xl font-bold text-gray-900'>Connection</div>
                    </div>
                </div>
            </div>
            <AddConnectionModal
                open={addConnectionModal}
                onClose={() => setAddConnectionModal(false)}
                saveConnection={saveConnection}
            />
        </>
    );
}
