import React from 'react';

import AddConnectionModal from './AddConnectionModal';

export default function ConnectionComponent() {
    const [addConnectionModal, setAddConnectionModal] = React.useState<boolean>(false);

    return (
        <>
            <div className='container mx-auto'>
                <div className='grid grid-cols-3 gap-4'>
                    <div className='col-span-2'>
                        <div className='text-2xl font-bold text-gray-900'>
                            RPC Provider
                        </div>
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
            />
        </>
    );
}
