import React, { useState } from 'react';
import { Translate } from 'react-localize-redux';
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
                <Translate id='recoverManual.cantFindAccount' />{' '}
                <span
                    className='underline color-blue cursor-pointer'
                    onClick={() => {
                        setManualImportOpen(true);
                    }}
                >
                    <Translate id='recoverManual.buttonImportManually' />{' '}
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
