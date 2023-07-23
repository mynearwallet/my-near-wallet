import React, { useRef } from 'react';
import { Translate } from 'react-localize-redux';

import classNames from '../../utils/classNames';
import FormButton from '../common/FormButton';

const RecoverAccountExportFileForm = ({
    handleExportFileChange,
    handleSecretKeyChange,
    exportFile,
    secretKey,
    localAlert,
    recoveringAccount,
    findMyAccountSending,
}) => {
    const exportFileNameRef = useRef(null);
    const exportFileRef = useRef(null);

    function exportFileChange(e) {
        const exportFile = e.target.files[0];

        exportFileNameRef.current.value = exportFile.name;

        handleExportFileChange(exportFile);
    }

    return (
        <>
            <h4>
                <Translate id='recoverExportFile.secretKeyInput.title' />
            </h4>
            <Translate>
                {({ translate }) => (
                    <input
                        value={secretKey}
                        onChange={(e) => handleSecretKeyChange(e.target.value)}
                        className={classNames([
                            { success: localAlert && localAlert.success },
                            { problem: localAlert && localAlert.success === false },
                        ])}
                        placeholder={translate(
                            'recoverExportFile.secretKeyInput.placeholder'
                        )}
                        disabled={recoveringAccount}
                        data-test-id='exportFileRecoverySecretKeyInput'
                        required
                        tabIndex='2'
                        autoCapitalize='off'
                    />
                )}
            </Translate>
            <h4>
                <Translate id='recoverExportFile.exportFileInput.title' />
            </h4>
            <Translate>
                {({ translate }) => (
                    <input
                        ref={exportFileNameRef}
                        onClick={() => {
                            exportFileRef.current.click();
                        }}
                        className={classNames([
                            { success: localAlert && localAlert.success },
                            { problem: localAlert && localAlert.success === false },
                        ])}
                        placeholder={translate(
                            'recoverExportFile.exportFileInput.placeholder'
                        )}
                        disabled={recoveringAccount}
                        readOnly={true}
                        data-test-id='exportFileRecoveryFileInput'
                        autoCapitalize='off'
                    />
                )}
            </Translate>
            <input
                ref={exportFileRef}
                onChange={exportFileChange}
                type='file'
                accept='.txt'
                required
                tabIndex='3'
                style={{ display: 'none' }}
            />
            <FormButton
                type='submit'
                color='blue'
                disabled={
                    (localAlert && localAlert.success === false) ||
                    recoveringAccount ||
                    !exportFile
                }
                sending={findMyAccountSending}
                sendingString='button.recovering'
                data-test-id='exportFileRecoverySubmitButton'
            >
                <Translate id='button.findMyAccount' />
            </FormButton>
        </>
    );
};

export default RecoverAccountExportFileForm;
