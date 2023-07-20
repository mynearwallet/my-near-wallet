import React, { useState } from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import ExportLocalStorageImage from '../../../images/icon-phrase.svg';
import FormButton from '../../common/FormButton';
import Container from '../../common/styled/Container.css';
import ExportLocalStorageModal from './ExportLocalStorageModal';

const StyledContainer = styled(Container)`
    margin-top: 16px;
    padding-top: 0;
    padding-bottom: 0;

    > button {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .export-local-storage-icon {
        margin-right: 12px;
        width: 20px;
        height: 19px;
    }
`;

export default () => {
    const [showExportLocalStorageModal, setShowExportLocalStorageModal] = useState(false);

    return (
        <StyledContainer>
            <FormButton
                color='gray-blue'
                onClick={() => setShowExportLocalStorageModal(true)}
            >
                <img
                    src={ExportLocalStorageImage}
                    className='export-local-storage-icon'
                    alt='Export Local Storage'
                />
                <Translate id='exportLocalStorage.button' />
            </FormButton>
            {showExportLocalStorageModal && (
                <ExportLocalStorageModal
                    onClose={() => setShowExportLocalStorageModal(false)}
                    isOpen={showExportLocalStorageModal}
                />
            )}
        </StyledContainer>
    );
};
