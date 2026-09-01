/**
 * SignDelegateActionInvalid - Error display for invalid delegate action requests
 */

import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import FormButton from '../common/FormButton';
import Container from '../common/styled/Container.css';

const StyledContainer = styled(Container)`
    background-color: #f0f0f1;
    padding: 25px;
    text-align: center;

    .error-icon {
        font-size: 48px;
        margin-bottom: 16px;
    }

    .title {
        font-size: 20px;
        font-weight: 600;
        color: #24272a;
        margin-bottom: 12px;
    }

    .message {
        font-size: 14px;
        color: #72727a;
        margin-bottom: 24px;
        line-height: 1.5;
    }

    .error-details {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        padding: 14px;
        margin-bottom: 24px;
        font-size: 13px;
        color: #dc2626;
        text-align: left;
        word-break: break-word;
    }
`;

const SignDelegateActionInvalid = ({ error, onClose }) => {
    return (
        <StyledContainer className='small-centered border brs-8 bsw-l'>
            <div className='error-icon'>!</div>
            <div className='title'>
                <Translate id='signDelegateAction.invalidRequest' />
            </div>
            <div className='message'>
                <Translate id='signDelegateAction.invalidRequestMessage' />
            </div>
            {error && <div className='error-details'>{error}</div>}
            <FormButton onClick={onClose}>
                <Translate id='button.close' />
            </FormButton>
        </StyledContainer>
    );
};

export default SignDelegateActionInvalid;
