import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import LockImage from '../../../images/icon-lock.svg';
import FormButton from '../../common/FormButton';
import Container from '../../common/styled/Container.css';

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

    .export-private-key-icon {
        margin-right: 12px;
        width: 20px;
        height: 19px;
    }
`;

export const AddPasswordButton = () => {
    const [keyEncrypted, setKeyEncrypted] = useState(false);

    useEffect(() => {
        const encryptedEntry = localStorage.getItem('NEAR_WALLET_ENCRYPTED');
        if (encryptedEntry) {
            setKeyEncrypted(true);
        }
    }, []);

    if (keyEncrypted) {
        return null;
    }

    return (
        <StyledContainer>
            <FormButton linkTo='/set-encryption'>
                <img
                    src={LockImage}
                    className='export-private-key-icon'
                    alt='export-private-key-icon'
                />
                Add Password to Wallet
            </FormButton>
        </StyledContainer>
    );
};
