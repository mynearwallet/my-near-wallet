import React, { useState } from 'react';
import { ModalManualImport } from './ModalManualImport';
import { EWalletImportInputType } from './type';

interface Props {
    importType: EWalletImportInputType;
}

const ModalManualImportWithButton = ({ importType }: Props) => {
    const [isManualImportOpen, setManualImportOpen] = useState(false);
    return (
        <>
            <div className='mt-4'>
                Can't find your account?{' '}
                <span
                    className='underline color-blue cursor-pointer'
                    onClick={() => {
                        console.log('set');
                        setManualImportOpen(true);
                    }}
                >
                    Import it manually.
                </span>
            </div>
            <ModalManualImport
                importType={importType}
                isVisible={isManualImportOpen}
                setVisible={setManualImportOpen}
            />
        </>
    );
};

export default ModalManualImportWithButton;
